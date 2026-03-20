"use client"

import * as React from "react"
import type * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/**
 * Form is a context provider for React Hook Form, enabling form state management and validation.
 *
 * @example
 *   // Example usage with a controlled input and validation
 *   import { useForm } from "react-hook-form";
 *   import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "./form";
 *   import { Input } from "./input";
 *
 *   const MyForm = () => {
 *     const form = useForm({ defaultValues: { email: "" } });
 *     return (
 *       <Form {...form}>
 *         <form onSubmit={form.handleSubmit(data => console.log(data))}>
 *           <FormField name="email" control={form.control} rules={{ required: "Email required" }}>
 *             <FormItem>
 *               <FormLabel>Email</FormLabel>
 *               <FormControl>
 *                 <Input type="email" />
 *               </FormControl>
 *               <FormMessage />
 *             </FormItem>
 *           </FormField>
 *           <button type="submit">Submit</button>
 *         </form>
 *       </Form>
 *     );
 *   };
 *
 * @see https://react-hook-form.com/
 *
 * @prop {React.ReactNode} [children] - Form content and subcomponents.
 * @returns A form context provider for child components.
 */
const Form = FormProvider

/**
 * Context value for FormField, providing the field name to nested components.
 * @template TFieldValues, TName
 * @property {TName} name - The name of the field in the form.
 */
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

// Context for sharing the field name with nested form components
const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

/**
 * FormField binds a field to React Hook Form and provides its name to nested components via context.
 *
 * @example
 *   <FormField name="email" control={form.control}>
 *     <FormItem>...</FormItem>
 *   </FormField>
 *
 * @template TFieldValues, TName
 * @param {ControllerProps<TFieldValues, TName>} props - Props for the field controller.
 * @returns A context provider for the field and a Controller for value binding.
 */
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      {/* Controller connects the field to React Hook Form's state and validation */}
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

/**
 * useFormField is a custom hook that provides field state, error, and accessibility IDs for a form field.
 *
 * @example
 *   const { error, formItemId } = useFormField();
 *
 * @throws If used outside a <FormField>.
 * @returns Object with field name, error state, and accessibility IDs.
 */
const useFormField = () => {
  // Get the field name from context (set by FormField)
  const fieldContext = React.useContext(FormFieldContext)
  // Get the unique item ID from FormItem context
  const itemContext = React.useContext(FormItemContext)
  // Get field state helpers from React Hook Form
  const { getFieldState } = useFormContext()
  // Get the current form state for this field
  const formState = useFormState({ name: fieldContext.name })
  // Get the error/dirty/touched state for this field
  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  // Return all relevant info for field rendering and accessibility
  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

/**
 * Context value for FormItem, providing a unique ID for accessibility.
 * @property {string} id - Unique identifier for the form item.
 */
type FormItemContextValue = {
  id: string
}

// Context for sharing a unique ID with nested form item components
const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

/**
 * FormItem is a container for a single form field, providing a unique ID for accessibility.
 *
 * @example
 *   <FormItem>
 *     <FormLabel>Email</FormLabel>
 *     <FormControl><Input /></FormControl>
 *     <FormMessage />
 *   </FormItem>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @prop {React.ReactNode} [children] - Field content.
 * @returns A styled container with context for accessibility.
 */
function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  // Generate a unique ID for this form item (used for aria attributes)
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

/**
 * FormLabel is a styled label for a form field, automatically linked to the field for accessibility.
 *
 * @example
 *   <FormLabel>Email</FormLabel>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @returns A styled label linked to the form field.
 */
function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  // Get error state and field ID for accessibility
  const { error, formItemId } = useFormField()

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

/**
 * FormControl is a wrapper for form input elements, wiring up accessibility attributes and error state.
 *
 * @example
 *   <FormControl><Input type="text" /></FormControl>
 *
 * @returns A Slot component with accessibility and error props.
 */
function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  // Get error state and accessibility IDs for the field
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
}

/**
 * FormDescription is a styled description for a form field, linked for accessibility.
 *
 * @example
 *   <FormDescription>Enter your email address.</FormDescription>
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @returns A styled description element for the field.
 */
function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  // Get the description ID for accessibility
  const { formDescriptionId } = useFormField()

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

/**
 * FormMessage displays validation errors or custom messages for a form field.
 *
 * @example
 *   <FormMessage />
 *
 * @prop {string} [className] - Additional CSS classes for custom styling.
 * @returns A styled message element for the field, or null if no message.
 */
function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  // Get error state and message ID for accessibility
  const { error, formMessageId } = useFormField()
  // Show error message if present, otherwise show children
  const body = error ? String(error?.message ?? "") : props.children

  if (!body) {
    return null
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      {body}
    </p>
  )
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
