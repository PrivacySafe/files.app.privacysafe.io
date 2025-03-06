export interface FsSEntityInfoProps {
  path: string;
}

export interface FsSEntityInfoEmits {
  (event: 'close'): void;
}
