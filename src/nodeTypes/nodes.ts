import { LPCNode } from "./lpcNode";

export interface IVisitor {
	visitNode: (node: LPCNode) => boolean;
}

export interface IVisitorFunction {
	(node: LPCNode): boolean;
}