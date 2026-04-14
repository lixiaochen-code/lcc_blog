export interface ToolDefinition {
  name: string;
  description: string;
}

export function defineTool(definition: ToolDefinition): ToolDefinition {
  return definition;
}
