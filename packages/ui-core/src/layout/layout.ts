/**
 * Layout component types and schemas
 */

import type { Size } from '../theme';
import { z } from 'zod';

// Container types
export interface ContainerProps {
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'none';
  padding?: Size | number;
  centerContent?: boolean;
  className?: string;
  id?: string;
  children: React.ReactNode;
}

// Grid types
export type GridAlignment = 'start' | 'center' | 'end' | 'stretch';
export type GridJustification = 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';

export interface GridProps {
  columns?: number | string;
  rows?: number | string;
  gap?: Size | number;
  columnGap?: Size | number;
  rowGap?: Size | number;
  alignItems?: GridAlignment;
  justifyItems?: GridAlignment;
  alignContent?: GridAlignment;
  justifyContent?: GridJustification;
  className?: string;
  id?: string;
  children: React.ReactNode;
}

// Stack types
export type StackDirection = 'row' | 'column';
export type StackAlignment = 'start' | 'center' | 'end' | 'stretch';
export type StackJustification = 'start' | 'center' | 'end' | 'space-between' | 'space-around';

export interface StackProps {
  direction?: StackDirection;
  spacing?: Size | number;
  align?: StackAlignment;
  justify?: StackJustification;
  wrap?: boolean;
  className?: string;
  id?: string;
  children: React.ReactNode;
}

// Box types (flexible container)
export interface BoxProps {
  display?: 'block' | 'flex' | 'inline-flex' | 'grid' | 'inline-grid';
  flexDirection?: StackDirection;
  alignItems?: StackAlignment;
  justifyContent?: StackJustification;
  gap?: Size | number;
  padding?: Size | number;
  margin?: Size | number;
  width?: string | number;
  height?: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;
  className?: string;
  id?: string;
  children: React.ReactNode;
}

// Zod schemas
export const ContainerPropsSchema = z.object({
  maxWidth: z.enum(['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full', 'none']).optional(),
  padding: z.union([z.enum(['xs', 'sm', 'md', 'lg', 'xl']), z.number()]).optional(),
  centerContent: z.boolean().optional(),
  className: z.string().optional(),
  id: z.string().optional(),
});

export const GridPropsSchema = z.object({
  columns: z.union([z.number(), z.string()]).optional(),
  rows: z.union([z.number(), z.string()]).optional(),
  gap: z.union([z.enum(['xs', 'sm', 'md', 'lg', 'xl']), z.number()]).optional(),
  columnGap: z.union([z.enum(['xs', 'sm', 'md', 'lg', 'xl']), z.number()]).optional(),
  rowGap: z.union([z.enum(['xs', 'sm', 'md', 'lg', 'xl']), z.number()]).optional(),
  alignItems: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  justifyItems: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  alignContent: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  justifyContent: z.enum(['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly']).optional(),
  className: z.string().optional(),
  id: z.string().optional(),
});

export const StackPropsSchema = z.object({
  direction: z.enum(['row', 'column']).optional(),
  spacing: z.union([z.enum(['xs', 'sm', 'md', 'lg', 'xl']), z.number()]).optional(),
  align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  justify: z.enum(['start', 'center', 'end', 'space-between', 'space-around']).optional(),
  wrap: z.boolean().optional(),
  className: z.string().optional(),
  id: z.string().optional(),
});

export const BoxPropsSchema = z.object({
  display: z.enum(['block', 'flex', 'inline-flex', 'grid', 'inline-grid']).optional(),
  flexDirection: z.enum(['row', 'column']).optional(),
  alignItems: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  justifyContent: z.enum(['start', 'center', 'end', 'space-between', 'space-around']).optional(),
  gap: z.union([z.enum(['xs', 'sm', 'md', 'lg', 'xl']), z.number()]).optional(),
  padding: z.union([z.enum(['xs', 'sm', 'md', 'lg', 'xl']), z.number()]).optional(),
  margin: z.union([z.enum(['xs', 'sm', 'md', 'lg', 'xl']), z.number()]).optional(),
  width: z.union([z.string(), z.number()]).optional(),
  height: z.union([z.string(), z.number()]).optional(),
  maxWidth: z.union([z.string(), z.number()]).optional(),
  maxHeight: z.union([z.string(), z.number()]).optional(),
  className: z.string().optional(),
  id: z.string().optional(),
});

// Type inference
export type ContainerPropsInput = z.infer<typeof ContainerPropsSchema>;
export type GridPropsInput = z.infer<typeof GridPropsSchema>;
export type StackPropsInput = z.infer<typeof StackPropsSchema>;
export type BoxPropsInput = z.infer<typeof BoxPropsSchema>;
