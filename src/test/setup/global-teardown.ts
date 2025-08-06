// src/test/setup/global-teardown.ts
export default async (): Promise<void> => {
  // Clean up any global resources here
  console.log('Test environment teardown complete');
};