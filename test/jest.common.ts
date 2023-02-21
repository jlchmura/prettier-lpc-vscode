import { Config } from "@jest/types";

const commonConfig: Config.InitialOptions = {
  testEnvironment: "node",
  rootDir: "../",
  moduleFileExtensions: ["js", "jsx", "ts"],
  testPathIgnorePatterns: ["jest.*.ts", "cdk.out", "dist", "out"],
  transform: {
    "^.+\\.(t|j)s$": "@swc-node/jest",
  },
  setupFilesAfterEnv: ["<rootDir>/test/setupAfterEnv.ts"],
};

export { commonConfig };
