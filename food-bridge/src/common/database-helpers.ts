import { QueryFailedError, QueryRunner } from 'typeorm';

export async function getDatabaseTime(queryRunner: QueryRunner) {
  const rows: { now: Date }[] = await queryRunner.query(
    'SELECT clock_timestamp() AS now',
  );
  return new Date(rows[0].now);
}

export function isUniqueViolation(error: unknown) {
  if (error instanceof QueryFailedError) {
    const driverError = error.driverError as { code?: string };
    return driverError.code === '23505';
  }
  return false;
}
