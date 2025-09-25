/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExecutorContext } from "./types";

export async function filterNode(ctx: ExecutorContext): Promise<any> {
  const { input, node } = ctx;
  const filters = node.data.filters || [];

  if (!input) return input;

  // Helper to apply a single filter condition on an item
  function applyFilterCondition(item: any, filter: any): boolean {
    const { field, operator, value } = filter;

    // If multiple inputs connected, field might be 'input_1', 'input_2', etc.
    // For simplicity, assume field is 'input' or a key in item
    let fieldValue = item;

    if (field && field !== "input") {
      // If item is object, get field value
      if (item && typeof item === "object") {
        fieldValue = item[field];
      } else {
        fieldValue = undefined;
      }
    }

    switch (operator) {
      case "exists":
        return fieldValue !== undefined && fieldValue !== null;
      case "does not exist":
        return fieldValue === undefined || fieldValue === null;
      case "is empty":
        return (
          fieldValue === "" ||
          (Array.isArray(fieldValue) && fieldValue.length === 0)
        );
      case "is not empty":
        return (
          fieldValue !== "" &&
          (!Array.isArray(fieldValue) || fieldValue.length > 0)
        );
      case "is equal to":
        return fieldValue === value;
      case "is not equal to":
        return fieldValue !== value;
      case "contains":
        return typeof fieldValue === "string" && fieldValue.includes(value);
      case "does not contain":
        return typeof fieldValue === "string" && !fieldValue.includes(value);
      case "starts with":
        return typeof fieldValue === "string" && fieldValue.startsWith(value);
      case "does not start with":
        return typeof fieldValue === "string" && !fieldValue.startsWith(value);
      case "ends with":
        return typeof fieldValue === "string" && fieldValue.endsWith(value);
      case "does not end with":
        return typeof fieldValue === "string" && !fieldValue.endsWith(value);
      default:
        return true; // If unknown operator, don't filter out
    }
  }

  // If input is array, filter items
  if (Array.isArray(input)) {
    return input.filter((item) => {
      // All filters must pass (AND logic)
      return filters.every((filter: any) => applyFilterCondition(item, filter));
    });
  }

  // If input is single object or primitive, apply filters directly
  if (typeof input === "object" && input !== null) {
    const passes = filters.every((filter: any) =>
      applyFilterCondition(input, filter)
    );
    return passes ? input : null;
  }

  // For primitives, no filtering applied
  return input;
}
