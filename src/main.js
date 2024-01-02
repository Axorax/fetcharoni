const { app, BrowserWindow, Menu, shell } = require("electron");
const express = require("express");
const path = require("path");
const server = express();
const isMac = process.platform === "darwin";

// Server

server.set("views", path.join(__dirname, "views"));
server.use(express.static(__dirname + "/static"));
server.use(express.json());
server.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  next();
});

server.get("/", async (req, res) => {
  try {
    res.sendFile(path.join(__dirname, "views", "home.html"));
  } catch (error) {
    console.error("Error rendering HTML file:", error);
    res.status(500).send("Internal Server Error");
  }
});

server.post("/fetch", async (req, res) => {
  const { address, headers, body, options, method } = req.body;

  try {
    const dynamicCode = `
            fetch('${address}', {
                method: '${method}',
                ${options != undefined ? options : ""}
                ${
                  method != "GET"
                    ? `headers: ${headers},
                body: ${body},`
                    : ""
                }

            })
        `;

    const response = await eval(dynamicCode);
    const result = await response.text();

    const data = {
      status: response.status,
      statusText: response.statusText,
      headers: {},
    };

    response.headers.forEach((value, key) => {
      data.headers[key] = value;
    });

    res.json({
      result: result,
      status: data.status,
      headers: data.headers,
    });
  } catch (error) {
    res.json({
      result: JSON.stringify({ error: true, message: String(error) }),
    });
  }
});

server.get("/delay-test", (req, res) => {
  setTimeout(() => {
    res.send("ok");
  }, 5000);
});

server.post("/body-test", (req, res) => {
  try {
    const { text } = req.body;
    res.send("req.body received! " + text);
  } catch (e) {
    res.send(e);
  }
});

const serverPort = server.listen(0, () => {
  const PORT = serverPort.address().port;
  console.log(`Server is running on port http://localhost:${PORT}`);
});

// App

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    title: "Fetcharoni",
    width: 1200,
    height: 700,
    icon: __dirname + "/static/fetcharoni.ico",
    webPreferences: {
      nodeIntegration: true,
      devTools: false
    },
  });

  mainWindow.loadURL(`http://localhost:${serverPort.address().port}`);
  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  const menuTemplate = [
    {
      label: "Fetcharoni",
      submenu: [
        {
          label: "GitHub",
          click: () => {
            shell.openExternal("https://github.com/Axorax");
          },
        },
        {
          label: "Socials",
          click: () => {
            shell.openExternal("https://github.com/Axorax/socials");
          },
        },
      ],
    },
    {
      label: "Donate",
      click: () => {
        shell.openExternal("https://www.patreon.com/axorax");
      },
    },
    {
      label: "Exit",
      accelerator: isMac ? "Cmd+Q" : "Ctrl+Q",
      click: () => {
        app.quit();
      },
    },
  ];

  const mainMenu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(mainMenu);

  mainWindow.webContents.on("new-window", (event, url) => {
    event.preventDefault();

    const newWindow = new BrowserWindow({
      title: "Fetcharoni",
      width: 1200,
      height: 700,
      icon: __dirname + "/static/fetcharoni.ico",
      devTools: false
    });

    newWindow.loadURL(url);
  });

  mainWindow.on("closed", () => (mainWindow = null));

  app.on("resize", function (e, x, y) {
    mainWindow.setSize(x, y);
  });

  app.on("window-all-closed", () => {
    if (!isMac) {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
