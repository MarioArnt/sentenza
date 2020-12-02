export abstract class SentenzaPipeline {
  abstract finished(): Promise<unknown>;
  abstract succeeded(): Promise<unknown>;
}
