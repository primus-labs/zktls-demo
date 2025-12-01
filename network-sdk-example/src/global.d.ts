export { };

declare global {
  interface Window {
    ethereum?: any;
  }
}

declare module '@primuslabs/network-js-sdk';