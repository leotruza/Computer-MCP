// SPDX-License-Identifier: GPL-3.0-only
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { detectEnvironment, screenSize } from "./platform/linux.js";
import { capture } from "./platform/screenshot.js";
import * as mouse from "./platform/mouse.js";
import * as keyboard from "./platform/keyboard.js";

const number = (min?: number, max?: number) => z.number().finite().min(min ?? -Infinity).max(max ?? Infinity);
const button = z.enum(["left", "right", "middle"]);
const schemas = {
  computer_screenshot: z.object({ display: z.string().optional(), format: z.enum(["png", "jpeg"]).default("png"), quality: number(1, 100).default(85), scale: number(0.1, 2).optional() }),
  computer_move_mouse: z.object({ x: number(0), y: number(0), duration: number(0, 10000).default(0) }),
  computer_click: z.object({ x: number(0), y: number(0), button: button.default("left"), clicks: z.number().int().min(1).max(10).default(1), interval: number(0, 5000).default(100) }),
  computer_mouse_down: z.object({ button: button.default("left") }), computer_mouse_up: z.object({ button: button.default("left") }),
  computer_scroll: z.object({ amount: z.number().int().min(-100).max(100), horizontal: z.number().int().min(-100).max(100).default(0) }),
  computer_type: z.object({ text: z.string().max(100000), interval: number(0, 1000).default(0) }),
  computer_key: z.object({ key: z.string().min(1).max(40) }), computer_hotkey: z.object({ keys: z.array(z.string().min(1).max(40)).min(1).max(10) }),
  computer_clipboard_set: z.object({ text: z.string().max(1000000) }), computer_clipboard_get: z.object({}), computer_screen_size: z.object({}), computer_environment: z.object({}),
};
type ToolName = keyof typeof schemas;
const descriptions: Record<ToolName, string> = {
  computer_screenshot: "Capture the current Linux desktop. Coordinates in the returned image use top-left origin; x increases right and y increases down. Browser interaction must use only this screenshot plus mouse and keyboard tools.",
  computer_screen_size: "Return desktop dimensions and detected monitor rectangles. Use the same top-left coordinate system as screenshots.", computer_environment: "Report X11/Wayland detection and available Linux desktop capabilities.",
  computer_move_mouse: "Move the mouse to screenshot coordinates.", computer_click: "Move and click at screenshot coordinates. Supports left, right, and middle buttons and repeated clicks.", computer_mouse_down: "Press and hold a mouse button.", computer_mouse_up: "Release a mouse button.", computer_scroll: "Scroll vertically with amount (positive up, negative down) and horizontally when supported.", computer_type: "Type literal text into the focused GUI application.", computer_key: "Press one key, such as ENTER, ESC, TAB, BACKSPACE, DELETE, HOME, END, PAGEUP, PAGEDOWN, UP, DOWN, LEFT, RIGHT, F1-F12, CTRL, ALT, SHIFT, or SUPER.", computer_hotkey: "Press a key combination such as [CTRL, L] or [CTRL, ALT, T]. Modifiers are always released after the operation, including on failure.", computer_clipboard_get: "Read the X11 desktop clipboard.", computer_clipboard_set: "Replace the X11 desktop clipboard with text."
};
const toolList = Object.keys(schemas).map(name => ({ name, description: descriptions[name as ToolName], inputSchema: zodToJsonSchema(schemas[name as ToolName]) }));
function zodToJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> { const shape = (schema as z.ZodObject<any>).shape; if (!shape) return { type: "object", properties: {} }; const properties: Record<string, unknown> = {}; const required: string[] = []; for (const [key, value] of Object.entries(shape)) { const v = value as z.ZodTypeAny; const def = (v as any)._def; const inner = def.typeName === "ZodDefault" ? def.innerType : v; const idef = (inner as any)._def; let item: Record<string, unknown> = idef.typeName === "ZodEnum" ? { type: "string", enum: idef.values } : idef.typeName === "ZodNumber" ? { type: "number" } : idef.typeName === "ZodArray" ? { type: "array", items: { type: "string" } } : { type: "string" }; properties[key] = item; if (def.typeName !== "ZodDefault" && !idef.isOptional) required.push(key); } return { type: "object", properties, ...(required.length ? { required } : {}) }; }
function text(message: string, data?: unknown) { return { content: [{ type: "text", text: data === undefined ? message : `${message}\n${JSON.stringify(data, null, 2)}` }] }; }
function parse<T extends ToolName>(name: T, args: unknown): any { return schemas[name].parse(args ?? {}); }

const server = new Server({ name: "computer-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: toolList }));
server.setRequestHandler(CallToolRequestSchema, async request => {
  const name = request.params.name as ToolName;
  try {
    if (!(name in schemas)) return { isError: true, ...text(`Unknown tool: ${name}`) };
    switch (name) {
      case "computer_screenshot": { const a = parse(name, request.params.arguments); const shot = await capture(a.format, a.quality, a.scale); return { content: [{ type: "image", data: shot.data.toString("base64"), mimeType: shot.mimeType }, { type: "text", text: JSON.stringify({ width: shot.width, height: shot.height, format: a.format }) }] }; }
      case "computer_screen_size": return text("Desktop dimensions", await screenSize());
      case "computer_environment": return text("Desktop environment", await detectEnvironment());
      case "computer_move_mouse": { const a = parse(name, request.params.arguments); await mouse.move(a.x, a.y, a.duration); return text("Mouse moved."); }
      case "computer_click": { const a = parse(name, request.params.arguments); await mouse.click(a.x, a.y, a.button, a.clicks, a.interval); return text("Mouse click completed."); }
      case "computer_mouse_down": { await mouse.down(parse(name, request.params.arguments).button); return text("Mouse button pressed."); }
      case "computer_mouse_up": { await mouse.up(parse(name, request.params.arguments).button); return text("Mouse button released."); }
      case "computer_scroll": { const a = parse(name, request.params.arguments); await mouse.scroll(a.amount, a.horizontal); return text("Scroll completed."); }
      case "computer_type": { const a = parse(name, request.params.arguments); await keyboard.typeText(a.text, a.interval); return text("Text typed."); }
      case "computer_key": { await keyboard.press(parse(name, request.params.arguments).key); return text("Key pressed."); }
      case "computer_hotkey": { await keyboard.hotkey(parse(name, request.params.arguments).keys); return text("Hotkey completed; modifiers released."); }
      case "computer_clipboard_get": return text("Clipboard contents", await keyboard.clipboardGet());
      case "computer_clipboard_set": { await keyboard.clipboardSet(parse(name, request.params.arguments).text); return text("Clipboard updated."); }
    }
  } catch (error) { return { isError: true, ...text(error instanceof Error ? error.message : String(error)) }; }
});

const transport = new StdioServerTransport();
const cleanup = async () => { try { await server.close(); } finally { process.exit(0); } };
process.on("SIGINT", cleanup); process.on("SIGTERM", cleanup);
process.on("uncaughtException", error => { console.error("Uncaught exception:", error); void cleanup(); });
process.on("unhandledRejection", error => { console.error("Unhandled promise rejection:", error); void cleanup(); });
await server.connect(transport);
