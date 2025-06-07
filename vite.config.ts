import MillionLint from "@million/lint";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import unocss from "unocss/vite";
import { ViteMcp } from "vite-plugin-mcp";

// https://vite.dev/config/
export default defineConfig({
	// experimental: {
	// 	enableNativePlugin: true,
	// },
	plugins: [
		MillionLint.vite({
			telemetry: false,
			enabled: true,
		}),
		react(),
		unocss(),
		ViteMcp(),
	],
});
