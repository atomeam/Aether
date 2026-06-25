import {
  PromptTemplate,
  PromptVariable,
  CompiledPrompt,
  PromptTemplateSchema,
  PromptVariableSchema,
  CompiledPromptSchema
} from './types';

export class TemplateEngine {
  private templates: Map<string, PromptTemplate> = new Map();

  createTemplate(
    name: string,
    template: string,
    description?: string,
    tags?: string[]
  ): PromptTemplate {
    const variables = this.extractVariables(template);
    const id = this.generateId();

    const promptTemplate: PromptTemplate = {
      id,
      name,
      template,
      variables,
      description,
      tags,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate with Zod
    PromptTemplateSchema.parse(promptTemplate);

    this.templates.set(id, promptTemplate);
    return promptTemplate;
  }

  compile(
    templateId: string,
    variables: PromptVariable[]
  ): CompiledPrompt {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Validate variables
    for (const variable of variables) {
      PromptVariableSchema.parse(variable);
    }

    // Check for missing variables
    const providedVars = new Set(variables.map((v) => v.name));
    const missingVars = template.variables.filter((v) => !providedVars.has(v));
    if (missingVars.length > 0) {
      throw new Error(`Missing variables: ${missingVars.join(', ')}`);
    }

    // Replace variables in template
    let text = template.template;
    const variableMap: Record<string, string> = {};

    for (const variable of variables) {
      const placeholder = `{{${variable.name}}}`;
      text = text.replace(new RegExp(placeholder, 'g'), variable.value);
      variableMap[variable.name] = variable.value;
    }

    const compiled: CompiledPrompt = {
      text,
      variables: variableMap,
      templateId
    };

    CompiledPromptSchema.parse(compiled);
    return compiled;
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  updateTemplate(
    id: string,
    updates: Partial<Pick<PromptTemplate, 'name' | 'template' | 'description' | 'tags'>>
  ): PromptTemplate {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }

    const updated = {
      ...template,
      ...updates,
      updatedAt: new Date()
    };

    if (updates.template) {
      updated.variables = this.extractVariables(updates.template);
    }

    PromptTemplateSchema.parse(updated);
    this.templates.set(id, updated);
    return updated;
  }

  deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  searchTemplates(query: string): PromptTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTemplates().filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description?.toLowerCase().includes(lowerQuery) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  private extractVariables(template: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = regex.exec(template)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  private generateId(): string {
    return `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
