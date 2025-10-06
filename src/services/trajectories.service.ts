export type TrajectoryInput = {
  title: string;
  description?: string;
};

export type Trajectory = {
  id: string;
  title: string;
  description?: string;
};

export async function listUserTrajectories(_userId: string | undefined): Promise<Trajectory[]> {
  // No model in schema; return empty list for now
  return [];
}

export async function createTrajectory(_userId: string | undefined, _input: TrajectoryInput): Promise<Trajectory> {
  // No model in schema; indicate not implemented
  throw Object.assign(new Error("Trajectory model not available"), { status: 501 });
}
