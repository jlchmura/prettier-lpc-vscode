/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AstPath } from "prettier";
import { LPCNode } from "../nodeTypes/lpcNode";
import { LPCOptions } from "../plugin";

/**
 * Takes a sorted array and a function p. The array is sorted in such a way that all elements where p(x) is false
 * are located before all elements where p(x) is true.
 * @returns the least x for which p(x) is true or array.length if no element fullfills the given function.
 */
export function findFirst<T>(
  array: T[],
  p: (x: T | undefined) => boolean
): number {
  let low = 0,
    high = array.length;
  if (high === 0) {
    return 0; // no children
  }
  while (low < high) {
    let mid = Math.floor((low + high) / 2);
    if (p(array[mid])) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }
  return low;
}

export function binarySearch<T>(
  array: T[],
  key: T,
  comparator: (op1: T | undefined, op2: T) => number
): number {
  let low = 0,
    high = array.length - 1;

  while (low <= high) {
    const mid = ((low + high) / 2) | 0;
    const comp = comparator(array[mid], key);
    if (comp < 0) {
      low = mid + 1;
    } else if (comp > 0) {
      high = mid - 1;
    } else {
      return mid;
    }
  }
  return -(low + 1);
}

export function last<T>(array: T[]): T | undefined {
  if (array.length > 0) return array[array.length - 1];
  return undefined;
}

export function first<T>(array: T[]): T | undefined {
  if (array.length > 0) return array[0];
  return undefined;
}

export function pushIfVal<T>(array: T[], val: T) {
  if (!!val) {
    array.push(val);
    return true;
  }
  return false;
}

export function someReverse<T>(
  array: T[],
  predicate: (value: T) => boolean
): boolean {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i])) {
      return true;
    }
  }

  return false;
}
