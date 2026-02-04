import type { PlayerInput } from '../types';

export class InputBuffer {
  private inputs: PlayerInput[] = [];
  private sequenceNumber = 0;
  private maxBufferSize = 60;

  public addInput(action: 'jump' | 'duck'): PlayerInput {
    const input: PlayerInput = {
      timestamp: Date.now(),
      action,
      sequenceNumber: ++this.sequenceNumber,
    };

    this.inputs.push(input);

    if (this.inputs.length > this.maxBufferSize) {
      this.inputs.shift();
    }

    return input;
  }

  public getInputsSince(sequenceNumber: number): PlayerInput[] {
    return this.inputs.filter((input) => input.sequenceNumber > sequenceNumber);
  }

  public clearBefore(sequenceNumber: number): void {
    this.inputs = this.inputs.filter(
      (input) => input.sequenceNumber >= sequenceNumber
    );
  }

  public clear(): void {
    this.inputs = [];
    this.sequenceNumber = 0;
  }

  public getLastSequenceNumber(): number {
    return this.sequenceNumber;
  }
}
