import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

type InputRecord = Record<string, unknown>;

function isRecord(input: unknown): input is InputRecord {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

function requiredText(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw httpError(`${field} is required`, 400);
  }
  return value.trim();
}

function objectId(value: unknown, field: string) {
  if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) {
    throw httpError(`${field} must be a valid ID`, 400);
  }
  return new Types.ObjectId(value);
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function activityFocus(type: string) {
  const normalizedType = normalize(type);
  if (['run', 'cycle', 'walk'].includes(normalizedType)) return 'endurance';
  return normalizedType;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError('Activity details are required', 400);
  const userId = objectId(input.userId, 'userId');
  const teamId = objectId(input.teamId, 'teamId');
  const type = requiredText(input.type, 'type');
  const minutes = input.minutes;
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw httpError('minutes must be a positive number', 400);
  }

  const [user, team] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!user || !team) throw httpError('The selected user or team does not exist', 404);

  return Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError('Team details are required', 400);
  const name = requiredText(input.name, 'name');
  const mascot = requiredText(input.mascot, 'mascot');
  const memberIds = input.members ?? [];
  if (!Array.isArray(memberIds)) throw httpError('members must be an array', 400);
  const members = memberIds.map((memberId) => objectId(memberId, 'member ID'));
  if (members.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: members } });
    if (existingMembers !== new Set(members.map(String)).size) {
      throw httpError('One or more team members do not exist', 404);
    }
  }
  return Team.create({ name, mascot, members });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const totalsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: totalsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints)
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: normalize(userEmail) }).lean();
  if (!user) throw httpError('User not found', 404);

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().lean(),
  ]);
  const goal = normalize(user.fitnessGoal);
  const recentFocus = recentActivity ? activityFocus(recentActivity.type) : undefined;
  const goalMatchExists = workouts.some((workout) => normalize(workout.focus) === goal);
  const preferredFocus = goalMatchExists ? goal : recentFocus;

  return workouts
    .map((workout) => {
      const focus = normalize(workout.focus);
      const matchesGoal = focus === goal;
      const matchesActivity = focus === recentFocus;
      const reason = matchesGoal
        ? `Recommended because it matches your ${user.fitnessGoal} fitness goal.`
        : matchesActivity
          ? `Recommended based on your recent ${recentActivity?.type} activity.`
          : 'Suggested as an additional training option.';
      return { ...workout, reason, score: focus === preferredFocus ? 2 : matchesActivity ? 1 : 0 };
    })
    .sort((left, right) => right.score - left.score)
    .map(({ score: _score, ...workout }) => workout);
}

export { User };
