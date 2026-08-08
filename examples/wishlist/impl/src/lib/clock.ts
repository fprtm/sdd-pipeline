// Injectable clock so time-dependent behavior is deterministic in tests.
export type Clock = () => Date;

export const systemClock: Clock = () => new Date();
