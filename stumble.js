const chalk = require("chalk");
const figlet = require("figlet");
const inquirer = require("inquirer");
const request = require("@i-scrapper/plugins-request");

const questions = [
    {
        type: "input",
        name: "authorization",
        message: color("Authorization keys:"),
        prefix: `${color("[", "redBright")}+${color("]", "redBright")}`,
        suffix: "~",
        validate: function (input) {
            const done = this.async();
            if (!input) {
                done('You need to provide Authorization keys');
                return false;
            }
            let authParse;
            try {
                authParse = JSON.parse(input);
            } catch (error) {
                authParse = error.message;
            }
            if (typeof authParse != "object") {
                done("You need to provide Authorization keys as Object");
                return false;
            }
            return done(null, true);
        },
    },
    {
        type: "list",
        name: "round",
        message: color("Authorization keys taken at 'Round':"),
        prefix: `${color("[", "redBright")}+${color("]", "redBright")}`,
        suffix: "~",
        choices: ["Stage 1", "Stage 2", "Stage 3"],
        filter: (value) => {
            return {
                "Stage 1": 1,
                "Stage 2": 2,
                "Stage 3": 3,
            }[value];
        },
    },
    {
        type: "input",
        name: "interval",
        message: color("Interval Delay:"),
        prefix: `${color("[", "redBright")}+${color("]", "redBright")}`,
        suffix: "~",
        default: 1000,
        validate: function (input) {
            const done = this.async();
            if (input && isNaN(input)) {
                done('You need to provide a number');
                return false;
            }
            return done(null, true);
        },
    }
];

const asciiText = figlet.textSync("i - Stumble", {
    font: 'Graffiti',
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 75,
    whitespaceBreak: true
});
console.log(color(asciiText, "redBright"));

inquirer.prompt(questions)
    .then(async ({ authorization, round, interval }) => {
        const authParse = JSON.parse(authorization);
        iStumble(interval, round, authParse);
    });

function iStumble(interval, round, authorization) {
    setInterval(async function iStumble() {
        try {
            const { data } = await stageRequest(authorization, round);
            if (typeof data != "object") {
                if (data.includes("SERVER_ERROR")) {
                    console.error(color("SERVER_ERROR", "redBright"));
                } else if (data.includes("BANNED")) {
                    console.error(color("BANNED", "redBright"));
                } else {
                    console.error(color(data, "redBright"));
                }
            } else {
                const date = new Date();
                let { Id, Username, Country, Region, Crowns, SkillRating } = data.User;
                const print = `[${color(date.getHours())}:${date.getMinutes()}] ` + [color(Id, "blueBright"), color(Username), color(Country, "cyan"), color(Region, "cyanBright"), color(Crowns, "greenBright"), color(SkillRating, "yellowBright")].join(" | ");
                console.log(print);
            }
        } catch (error) {
            console.error(error);
        }
    }, Number(interval));
}

function color(text, color) {
    return color ? chalk[color].bold(text) : chalk.white.bold(text);
}

function stageRequest(authorization, round) {
    return new Promise((resolve, reject) => {
        request({
            url: `http://kitkabackend.eastus.cloudapp.azure.com:5010/round/finishv2/${round}`,
            headers: {
                Authorization: JSON.stringify(authorization),
                use_response_compression: true,
                "Accept-Encoding": "gzip",
                "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 9; Redmi 7 MIUI/V11.0.7.0.PFLMIXM)",
            }
        })
            .then((response) => {
                resolve(response);
            })
            .catch((error) => {
                if (error.response && error.response.status) {
                    console.log(color(`${error.response.status}: ${error.response.statusText}`, "redBright"));
                }
                reject(error);
            });
    });
}