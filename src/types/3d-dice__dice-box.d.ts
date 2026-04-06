declare module "@3d-dice/dice-box" {
  export type DiceBoxConfig = {
    assetPath: string;
    container?: string | null;
    id?: string;
    theme?: string;
    themeColor?: string;
    scale?: number;
    enableShadows?: boolean;
    lightIntensity?: number;
    gravity?: number;
    mass?: number;
    throwForce?: number;
    spinForce?: number;
    startingHeight?: number;
  };

  export type DiceRollResult = {
    sides: number;
    value: number;
  };

  export default class DiceBox {
    canvas: HTMLCanvasElement;
    constructor(config?: DiceBoxConfig);
    init(): Promise<DiceBox>;
    show(): DiceBox;
    roll(
      notation: string,
      options?: {
        theme?: string;
        themeColor?: string;
        newStartPoint?: boolean;
      }
    ): Promise<DiceRollResult[]>;
    clear(): DiceBox;
  }
}
