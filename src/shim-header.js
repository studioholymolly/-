// ── Vendor shim: maps the bundle's minified vendor names to real imports ──
import * as E from "react";
import * as a from "react/jsx-runtime";
import { createRoot as Lv } from "react-dom/client";
import { createClient as a0 } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import "./index.css";

const In = Anthropic;
// __vitePreload shim — the lazy-loaded Docs page lives in this same file
const mt = (f) => f();
