// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function executeUserCode(userCode: string, inputData: any) {
  const wrappedCode = `
    return (function($input) {
      ${userCode}
    })($input);
  `;

  // eslint-disable-next-line no-useless-catch
  try {
    const executor = new Function("$input", wrappedCode);
    return executor(inputData);
  } catch (error) {
    throw error;
  }
}
