import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, test } from 'vitest';
const context = { module: { exports: {} as { splitQuestion: (text: string) => {prompt:string; options:string[]; warning:string} } } };
runInNewContext(readFileSync(new URL('../backend/learning/static/learning/exam-ocr.js',import.meta.url),'utf8'),context);
const { splitQuestion } = context.module.exports;
test('extracts actual multiline choices in answer order', () => {
  expect(splitQuestion('எது SI அலகு?\n(1) N m\ns⁻¹\n(2) J\n(3) kg')).toEqual({prompt:'எது SI அலகு?',options:['N m s⁻¹','J','kg'],warning:''});
});
test('ambiguous or missing numbering requires review, never fabricates options', () => {
  for (const input of ['Question\n(1) A\n(3) C', 'Question\nA B C', 'Question (2) B (1) A']) {
    expect(splitQuestion(input).options).toEqual([]);
    expect(splitQuestion(input).warning).toBeTruthy();
  }
});
