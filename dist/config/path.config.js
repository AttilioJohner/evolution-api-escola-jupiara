"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORE_DIR = exports.AUTH_DIR = exports.SRC_DIR = exports.INSTANCE_DIR = exports.ROOT_DIR = void 0;
const path_1 = require("path");
exports.ROOT_DIR = process.cwd();
exports.INSTANCE_DIR = (0, path_1.join)(exports.ROOT_DIR, 'instances');
exports.SRC_DIR = (0, path_1.join)(exports.ROOT_DIR, 'src');
exports.AUTH_DIR = (0, path_1.join)(exports.ROOT_DIR, 'store', 'auth');
exports.STORE_DIR = (0, path_1.join)(exports.ROOT_DIR, 'store');
