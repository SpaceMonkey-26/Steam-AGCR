const API_KEY = 'API_KEY';
const STEAM_ID = '76561198076394061';

function updateSteamGamesSheet() {
	const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.clearContents();
  const data = getOwnedGames();

  const numRows = data.length;
  const numCols = data[0].length;

  if (sheet.getMaxRows() < numRows) {
    sheet.insertRowsAfter(sheet.getMaxRows(), numRows - sheet.getMaxRows());
  }
  if (sheet.getMaxColumns() < numCols) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), numCols - sheet.getMaxColumns());
  }

  const range = sheet.getRange(1, 1, numRows, numCols);
  range.setValues(data);

  const totalRows = sheet.getMaxRows();
  if (totalRows > numRows) {
    sheet.deleteRows(numRows + 1, totalRows - numRows);
  }
  const totalCols = sheet.getMaxColumns();
  if (totalCols > numCols) {
    sheet.deleteColumns(numCols + 1, totalCols - numCols);
  }

  sheet.getRange(2, 3, numRows - 1).setNumberFormat("0.0");
  sheet.getRange(2, 4, numRows - 1).setNumberFormat("0");
  sheet.getRange(2, 5, numRows - 1).setNumberFormat("0");
  sheet.getRange(2, 6, numRows - 1).setNumberFormat("0.0%");
  sheet.getRange(1, 1, 1, numCols).setFontWeight("bold"); 
  range.setHorizontalAlignment("center");
  sheet.autoResizeColumns(1, numCols); 
  for (let col = 1; col <= numCols; col++) {
    const currentWidth = sheet.getColumnWidth(col);
    sheet.setColumnWidth(col, currentWidth + 5);
  }

  sheet.getRange(2, 1, numRows - 1, numCols).sort([
    { column: 6, ascending: false },
    { column: 1, ascending: true }
  ]);

  applyConditionalFormatting(sheet, numRows, numCols);
  sheet.setFrozenRows(1);

  let numComplete = 0;
  let totalEarned = 0;
  let percentSum = 0;
  let percentCount = 0;

  for (let i = 1; i < data.length; i++) {
    const earned = data[i][3];
    const percentString = data[i][5];

    const percent = parseFloat(percentString) * 100;
    if (isNaN(percent)) continue;

    if (percent === 100) numComplete++;
    totalEarned += parseInt(earned);
    percentSum += percent;
    percentCount++;
  }

  const avgeragePercent = percentCount > 0 ? Math.floor(percentSum / percentCount) + "%" : "N/A";

  Logger.log("Total achievements earned: " + totalEarned);
  Logger.log("Perfect games: " + numComplete);
  Logger.log("Average game completion rate: " + avgeragePercent + "%");
}

function getOwnedGames() {
	const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${API_KEY}&steamid=${STEAM_ID}&include_appinfo=true&include_played_free_games=true`;
	const response = UrlFetchApp.fetch(url);
	const json = JSON.parse(response.getContentText());

	const games = json.response.games || [];

  const sharedGames = [
    { name: "Alba: A Wildlife Adventure", appid: 1337010, playtime: 2.5, earned: 9, total: 9, percent: 1 },
    { name: "Assemble with Care", appid: 1202900, playtime: 1.1, earned: 14, total: 14, percent: 1 },
    { name: "Cat Cafe Manager", appid: 1354830, playtime: "N/A", earned: 62, total: 62, percent: 1 },
    { name: "Garden Story", appid: 1062140, playtime: 20.7, earned: 21, total: 21, percent: 1 },
    { name: "Slime Rancher", appid: 433340, playtime: "N/A", earned: 57, total: 57, percent: 1 },
    { name: "Witchy Life Story", appid: 1427340, playtime: 13.4, earned: 26, total: 26, percent: 1 },
    { name: "Lemon Cake", appid: 1338330, playtime: 1.7, earned: 3, total: 17, percent: 0.1765 },
    { name: "Here Comes Niko!", appid: 925950, playtime: 3.2, earned: 1, total: 7, percent: 0.1429 }
  ]
  
	const data = [["Game", "App ID", "Playtime (hours)", "Earned", "Total", "Percent"]];

	games.forEach(game => {
		const name = game.name;
		const appid = game.appid;
		const playtime = ((game.playtime_forever || 0) / 60).toFixed(1);
    
    const achievements = getAchievementStats(appid);

    if (achievements.total === 0 || achievements.earned == 0) {
      return;
    }

		data.push([name, appid, parseFloat(playtime), achievements.earned, achievements.total, achievements.percent]);
    Utilities.sleep(200);
	});

  sharedGames.forEach(game => {
    data.push([game.name, game.appid, game.playtime, game.earned, game.total, game.percent]);
  });

	return data;
}

function getAchievementStats(appid) {
	try {
		const url = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${API_KEY}&steamid=${STEAM_ID}&appid=${appid}`;
		const response = UrlFetchApp.fetch(url);
		const json = JSON.parse(response.getContentText());

		if (!json.playerstats.success || !json.playerstats.achievements) {
			return { earned: 0, total: 0, percent: 0 };
		}

		const achievements = json.playerstats.achievements;
		const total = achievements.length;
		const earned = achievements.filter(a => a.achieved === 1).length;
		const percent = total > 0 ? parseFloat((earned / total).toFixed(3)) : 0;
		
		return { earned, total, percent };
	} 
  catch (e) {
		return { earned: 0, total: 0, percent: 0 };
	}
}

function applyConditionalFormatting(sheet, numRows, numCols) {
  sheet.clearConditionalFormatRules();

  const range = sheet.getRange(2, 1, numRows - 1, numCols);
  const values = range.getValues();

  for (let i = 0; i < values.length; i++) {
    const percent = values[i][5];

    if (percent === 1) {
      range.getCell(i + 1, 1).offset(0, 0, 1, numCols).setBackground("#b6d7a8");
    } else {
      range.getCell(i + 1, 1).offset(0, 0, 1, numCols).setBackground("#ea9999");
    }
  }
}
