(function (root) {
  "use strict";
  function object(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  function text(value, limit, optional) {
    return typeof value === "string" && value.length <= limit && (optional || value.trim().length > 0);
  }
  function validQuestion(question, draft) {
    return object(question) && typeof question.id === "string" && /^ownq-[a-z0-9-]{1,64}$/.test(question.id) &&
      text(question.text, 10000, draft) && Array.isArray(question.options) &&
      question.options.length >= 4 && question.options.length <= 8 &&
      question.options.every(function (option) { return text(option, 3000, draft); }) &&
      (draft || new Set(question.options.map(function (option) { return option.trim().toLocaleLowerCase("ru"); })).size === question.options.length) &&
      text(question.explanation, 10000, true) &&
      (!draft || Number.isInteger(question.correct) && question.correct >= 0 && question.correct < question.options.length);
  }
  function validTest(test, draft) {
    return object(test) && typeof test.id === "string" && /^own-[a-z0-9-]{1,64}$/.test(test.id) &&
      text(test.title, 160, draft) && text(test.description, 2000, true) &&
      typeof test.revision === "string" && test.revision.length <= 100 &&
      Array.isArray(test.questions) && test.questions.length > 0 &&
      new Set(test.questions.map(function (question) { return question && question.id; })).size === test.questions.length &&
      test.questions.every(function (question) { return validQuestion(question, draft); });
  }
  function validContent(content) {
    return object(content) && Array.isArray(content.tests) &&
      content.tests.every(function (test) { return validTest(test, false); }) &&
      new Set(content.tests.map(function (test) { return test.id; })).size === content.tests.length &&
      new Set(content.tests.flatMap(function (test) { return test.questions.map(function (question) { return question.id; }); })).size ===
        content.tests.reduce(function (total, test) { return total + test.questions.length; }, 0) &&
      (content.draft === null || validTest(content.draft, true));
  }
  function snapshot(value) {
    if (!object(value) || ![1, 2].includes(value.version) || !text(value.name, 32, false) ||
        !object(value.records) || !Object.values(value.records).every(object)) return null;
    var content = value.version === 1 ? { tests: [], draft: null } : { tests: value.tests, draft: value.draft };
    if (!validContent(content)) return null;
    return { version: 2, name: value.name.trim(), records: value.records, tests: content.tests, draft: content.draft };
  }
  root.PharmProfileModel = { validContent: validContent, validTest: validTest, snapshot: snapshot };
})(globalThis);
