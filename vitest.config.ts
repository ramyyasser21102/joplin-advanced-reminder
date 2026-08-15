import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	resolve: {
		alias: {
			api: path.resolve(__dirname, 'api'),
		},
	},
	test: {
		include: ['tests/**/*.test.ts'],
	},
});
