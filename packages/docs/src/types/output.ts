/**
 * Output types for documentation generators
 */

export interface DocOutput {
  /** Path to the generated file */
  path: string;
  /** Content of the generated file */
  content: string;
  /** Type of documentation */
  type: DocType;
  /** Metadata about the generation */
  metadata: DocMetadata;
}

export type DocType =
  | 'api'
  | 'architecture'
  | 'component'
  | 'example'
  | 'type'
  | 'readme'
  | 'markdown';

export interface DocMetadata {
  /** Timestamp of generation */
  generatedAt: Date;
  /** Generator version */
  generatorVersion: string;
  /** Source files analyzed */
  sourceFiles: string[];
  /** Number of items documented */
  itemCount: number;
  /** Any warnings or errors */
  warnings?: string[];
  /** Errors encountered */
  errors?: string[];
}

export interface ApiEndpoint {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  /** Endpoint path */
  path: string;
  /** Description */
  description: string;
  /** Request parameters */
  parameters?: ApiParameter[];
  /** Request body schema */
  requestBody?: any;
  /** Response schema */
  response?: any;
  /** Authentication required */
  authRequired?: boolean;
  /** Rate limit */
  rateLimit?: string;
  /** Example usage */
  example?: string;
}

export interface ApiParameter {
  /** Parameter name */
  name: string;
  /** Parameter location */
  in: 'path' | 'query' | 'header' | 'cookie';
  /** Parameter type */
  type: string;
  /** Whether required */
  required: boolean;
  /** Description */
  description: string;
  /** Default value */
  default?: any;
  /** Allowed values */
  enum?: any[];
}

export interface ComponentDoc {
  /** Component name */
  name: string;
  /** File path */
  filePath: string;
  /** Description */
  description: string;
  /** Props */
  props?: ComponentProp[];
  /** State */
  state?: ComponentState[];
  /** Methods */
  methods?: ComponentMethod[];
  /** Lifecycle hooks */
  lifecycle?: string[];
  /** Example usage */
  example?: string;
}

export interface ComponentProp {
  /** Prop name */
  name: string;
  /** Prop type */
  type: string;
  /** Whether required */
  required: boolean;
  /** Default value */
  default?: any;
  /** Description */
  description: string;
}

export interface ComponentState {
  /** State name */
  name: string;
  /** State type */
  type: string;
  /** Initial value */
  initial?: any;
  /** Description */
  description: string;
}

export interface ComponentMethod {
  /** Method name */
  name: string;
  /** Return type */
  returnType: string;
  /** Parameters */
  parameters: MethodParameter[];
  /** Description */
  description: string;
  /** Example usage */
  example?: string;
}

export interface MethodParameter {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: string;
  /** Whether required */
  required: boolean;
  /** Description */
  description: string;
}

export interface TypeDoc {
  /** Type name */
  name: string;
  /** Type kind */
  kind: 'interface' | 'type' | 'enum' | 'class' | 'function' | 'variable';
  /** File path */
  filePath: string;
  /** Description */
  description: string;
  /** Type definition */
  definition: string;
  /** Properties/members */
  members?: TypeMember[];
  /** Extends */
  extends?: string[];
  /** Implements */
  implements?: string[];
  /** Example usage */
  example?: string;
}

export interface TypeMember {
  /** Member name */
  name: string;
  /** Member type */
  type: string;
  /** Whether optional */
  optional: boolean;
  /** Description */
  description?: string;
  /** Default value */
  default?: any;
}
