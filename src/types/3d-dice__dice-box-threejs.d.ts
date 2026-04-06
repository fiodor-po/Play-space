declare module "@3d-dice/dice-box-threejs" {
  export type DiceColorset = {
    name?: string;
    foreground?: string | string[];
    background?: string | string[];
    outline?: string | string[];
    edge?: string | string[];
    texture?: string;
    material?: string;
  };

  export type DiceBoxThreeConfig = {
    assetPath?: string;
    sounds?: boolean;
    shadows?: boolean;
    color_spotlight?: number;
    light_intensity?: number;
    gravity_multiplier?: number;
    baseScale?: number;
    strength?: number;
    theme_material?: string;
    theme_surface?: string;
    theme_texture?: string;
    theme_colorset?: string;
    theme_customColorset?: DiceColorset | null;
    onRollComplete?: (results: unknown) => void;
  };

  export default class DiceBoxThree {
    constructor(containerSelector: string, config?: DiceBoxThreeConfig);
    initialize(): Promise<void>;
    updateConfig(config?: Partial<DiceBoxThreeConfig>): Promise<void>;
    clearDice(): void;
    roll(notation: string): Promise<unknown>;
  }
}
