"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.identify = void 0;
const identityService_1 = require("../services/identityService");
const identify = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, phoneNumber } = req.body;
        if (!email && !phoneNumber) {
            res.status(400).json({ error: 'Either email or phoneNumber must be provided' });
            return;
        }
        const response = yield (0, identityService_1.identifyContact)(email || null, (phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.toString()) || null);
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Error in /identify:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.identify = identify;
