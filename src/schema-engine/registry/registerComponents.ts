import type { ComponentType } from "react";
import type { SchemaBlock } from "../types";
import type { BlockRenderContext } from "../BlockRenderer";

export type SchemaRegistryProps = {
  block: SchemaBlock;
  ctx: BlockRenderContext;
};

const registry = new Map<string, ComponentType<SchemaRegistryProps>>();

export const registerBlockType = (type: string, component: ComponentType<SchemaRegistryProps>) => {
  registry.set(type.toUpperCase(), component);
};

export const getBlockComponent = (type: string) => registry.get(type.toUpperCase());

/** Block rendering is handled in BlockRenderer; registry reserved for future custom types. */
export const registerComponents = () => {
  // Field, table, matrix, group, section types map to common components via BlockRenderer.
};

registerComponents();
