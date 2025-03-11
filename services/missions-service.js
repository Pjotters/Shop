export class MissionsService {
    constructor() {
        this.dailyMissions = [
            {
                id: "play_games",
                title: "Spelmeester",
                description: "Speel 3 verschillende games",
                reward: 150,
                type: "daily"
            },
            {
                id: "high_score",
                title: "Score Koning",
                description: "Verbeter je highscore in een game",
                reward: 200,
                type: "daily"
            },
            {
                id: "social_butterfly",
                title: "Sociaal Vlinder",
                description: "Speel een game met een vriend",
                reward: 250,
                type: "daily"
            }
        ];
    }

    async refreshDailyMissions(userId) {
        // Ververs dagelijkse missies
    }
} 