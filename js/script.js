const ABI = [
  "function mintFee() public view returns (uint)",
  "function code(string memory) public view returns (string memory)",
  "function mint(string memory, string memory) public payable returns (uint)",
  "function mintTo(address, string memory, string memory) public payable returns (uint)",
  "function update(string memory, string memory) public",
  "function freeze(string memory) public",
];

const networks = {
  1: {
    // Mainnet
    name: "Ethereum",
    address: "0x96Ed551E794E95071B5b14968b8B954627c131C7",
    rpc: "https://mainnet.infura.io/v3/ba6069f6c1ff4bf6aa61f438e4e0fa8f",
  },
  4: {
    // Rinkeby
    name: "Rinkeby",
    address: "0x96Ed551E794E95071B5b14968b8B954627c131C7",
    rpc: "https://rinkeby.infura.io/v3/ba6069f6c1ff4bf6aa61f438e4e0fa8f",
  },
  1337: {
    // Localhost
    name: "Development",
    address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    rpc: "http://127.0.0.1:8545"
  },
};

ethers = window.ethers.ethers;

const state = {
  t3rm: {
    cursor: 0,
    line: "",
    lineTemp: "",
    cmdBuffer: [],
    cmdIdx: 0,
    cmdHistory: 64,
    prompt: "🔥 ",
    run: null,
  },
  web3: {
    account: null,
    signer: null,
    chainId: null,
    balance: null,
    contract: null,
    provider: null
  },
  ipfs: {
    supported: false,
  },
};

const web3Modal = new window.Web3Modal.default({
  cacheProvider: true,
  theme: "dark",
  providerOptions: {
    walletconnect: {
      package: window.WalletConnectProvider.default,
      options: {
        infuraId: "ba6069f6c1ff4bf6aa61f438e4e0fa8f",
      },
    },
    fortmatic: {
      package: window.Fortmatic,
      options: {
        key: "pk_live_6C8DA04280AA9E7D",
      },
    },
  },
});

const t3rm = new Terminal({
  cursorBlink: true,
  altClickMovesCursor: false,
  convertEol: true,
  fontSize: 14,
  scrollback: 64
});

const setup = async () => {
  t3rm.open(document.getElementById("t3rm"));
  t3rm.focus();

  const linksAddon = new WebLinksAddon();
  t3rm.loadAddon(linksAddon);

  const fitAddon = new FitAddon();
  t3rm.loadAddon(fitAddon);
  fitAddon.fit();
  window.addEventListener("resize", () => fitAddon.fit());
  t3rm.writeln(`888                                     `);
  t3rm.writeln(
    `888    ${c.bgWhiteBright(c.black(` INTERPLANETARY WEB3 TERMINAL `))}`
  );
  t3rm.writeln(`888                                     `);
  t3rm.writeln(`888888  ${c.redBright(`.d8888b.`)}   888d888 88888b.d88b. `);
  t3rm.writeln(`888\`\`\` ${c.redBright(`d88P  Y88b`)}  888P"   888 "888 "88b`);
  t3rm.writeln(`888         ${c.redBright(`.d88P`)}  888     888  888  888`);
  t3rm.writeln(`Y88b.      ${c.redBright(`8888"`)}   888     888  888  888`);
  t3rm.writeln(` "Y888      ${c.redBright(`"Y8b.`)}  888     888  888  888`);
  t3rm.writeln(`       ${c.redBright(`Y88b  d88P`)}`);
  t3rm.writeln(`        ${c.redBright(`"Y8888P"`)}        https://t3rm.dev`);

  try {
    state.web3.provider = new ethers.providers.JsonRpcProvider(networks[1].rpc)
    state.web3.contract = new ethers.Contract(
      networks[1].address,
      ABI,
      state.web3.provider
    );
    const blockNumber = await state.web3.provider.getBlockNumber()
    const blocksUntilLaunch = 13142069 - blockNumber
    const msgRaw = blocksUntilLaunch > 0 ? `Launches in ${blocksUntilLaunch} blocks.` :'Status: Live on Ethereum.'
    const msg = blocksUntilLaunch > 0 ? c.yellowBright(`Launches in ${blocksUntilLaunch} blocks.`) : c.yellowBright('Status: Live on Ethereum.')
    const msgPad =  [...new Array(40 - msgRaw.length)].map((_) => " ").join("");
    t3rm.writeln(msgPad + msg)
  } catch (err) {
    console.error(err);
  }

  t3rm.writeln("");
  t3rm.write(state.t3rm.prompt);

  try {
    await fetch("ipfs://QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx");
    state.ipfs.supported = true;
  } catch (err) {
    state.ipfs.supported = false;
  }
};
setup();

const ipfsUrl = (hash) =>
  state.ipfs.supported
    ? "ipfs://" + hash
    : "https://cloudflare-ipfs.com/ipfs/" + hash;

const clear = (screen) => {
  if (screen) t3rm.clear();
  t3rm.write(screen ? esc.eraseScreen : esc.eraseLine);
  t3rm.write(screen ? esc.cursorTo(0, 0) : esc.cursorTo(0));
  state.t3rm.cursor = 0;
  state.t3rm.line = "";
};

const exit = () => {
  state.t3rm.run = null;
  state.t3rm.prompt = "🔥 ";
  state.t3rm.line.length ? t3rm.writeln("") : clear();
  t3rm.write(state.t3rm.prompt);
};

const disconnect = async () => {
  state.web3.chainId = null;
  state.web3.signer = null;
  state.web3.balance = null;
  state.web3.contract = null;
  state.web3.account = null;
  state.web3.provider = null;
  window.web3 = null;
  web3Modal.clearCachedProvider();
};

const cmds = {
  connect: async () => {
    const updateChain = async () => {
      state.web3.chainId = await web3.eth.getChainId();
    };

    const updateAccounts = async () => {
      const accounts = await web3.eth.getAccounts();
      state.web3.account = accounts[0];
      state.web3.balance = await web3.eth.getBalance(state.web3.account);
    };

    try {
      const provider = await web3Modal.connect();
      window.web3 = new Web3(provider);
      provider.on("accountsChanged", () => updateAccounts);
      provider.on("chainChanged", updateChain);
      provider.on("disconnect", disconnect);

      await updateChain();
      if (!(state.web3.chainId in networks)) {
        disconnect();
        return t3rm.writeln("Error: Unsupported chainID.\n");
      }

      await updateAccounts();
      const currentProvider = new ethers.providers.Web3Provider(provider);
      state.web3.provider = currentProvider
      state.web3.signer = currentProvider.getSigner();
      state.web3.contract = new ethers.Contract(
        networks[state.web3.chainId].address,
        ABI,
        state.web3.signer
      );

      t3rm.writeln(
        `Connected to: ${c.bgYellowBright(
          c.black(networks[state.web3.chainId].name)
        )}\n`
      );
    } catch (err) {}
    exit();
  },
  disconnect: async () => {
    disconnect();
    t3rm.writeln(c.bgYellowBright(c.black("Disconnected.")));
    exit();
  },
  freeze: async (firstRun, args) => {
    if (!state.web3.account) {
      t3rm.writeln("Requires web3 connection.");
      return exit();
    }

    if (firstRun) {
      state.update = null;
      t3rm.write("Freeze command: ");
    } else {
      try {
        await state.web3.contract.freeze(args[0])
        t3rm.writeln(c.bgYellowBright(c.black("Frozen.")));
      } catch (err) {
        t3rm.writeln("Error freezing.");
      }
      exit();
    }
  },
  update: async (firstRun, args) => {
    if (!state.web3.account) {
      t3rm.writeln("Requires web3 connection.");
      return exit();
    }

    if (firstRun) {
      state.update = null;
      t3rm.write("Update command: ");
    } else {
      t3rm.writeln("");
      if (state.update === null) {
        const cmd = args[0].toLowerCase();
        t3rm.writeln(`New multihash for ${c.yellowBright(cmd)}:`);
        t3rm.write("ipfs://");
        state.update = cmd;
      } else {
        try {
          await state.web3.contract.update(state.update, args[0]);
          delete state.update;
          t3rm.writeln(c.bgYellowBright(c.black("Updated.")));
        } catch (err) {
          t3rm.writeln("Error updating.");
          console.error(err)
        }
        exit();
      }
    }
  },
  mint: async (firstRun, args) => {
    if (!state.web3.account) {
      t3rm.writeln("Requires web3 connection.");
      return exit();
    }

    if (firstRun) {
      clear(true);
      state.mint = null;
      t3rm.writeln(" __       __  ______  __    __  ________ ");
      t3rm.writeln("|  \\     /  \\|      \\|  \\  |  \\|        \\");
      t3rm.writeln(
        `| ${c.greenBright("$$")}\\   /  ${c.greenBright(
          "$$"
        )} \\${c.greenBright("$$$$$$")}| ${c.greenBright(
          "$$"
        )}\\ | ${c.greenBright("$$")} \\${c.greenBright("$$$$$$$$")}`
      );
      t3rm.writeln(
        `| ${c.greenBright("$$$")}\\ /  ${c.greenBright(
          "$$$"
        )}  | ${c.greenBright("$$")}  | ${c.greenBright(
          "$$$"
        )}\\| ${c.greenBright("$$")}   | ${c.greenBright("$$")}   `
      );
      t3rm.writeln(
        `| ${c.greenBright("$$$$")}\\  ${c.greenBright(
          "$$$$"
        )}  | ${c.greenBright("$$")}  | ${c.greenBright(
          "$$$$"
        )}\\ ${c.greenBright("$$")}   | ${c.greenBright("$$")}   `
      );
      t3rm.writeln(
        `| ${c.greenBright("$$")}\\${c.greenBright("$$")} ${c.greenBright(
          "$$"
        )} ${c.greenBright("$$")}  | ${c.greenBright("$$")}  | ${c.greenBright(
          "$$"
        )}\\${c.greenBright("$$")} ${c.greenBright("$$")}   | ${c.greenBright(
          "$$"
        )}   `
      );
      t3rm.writeln(
        `| ${c.greenBright("$$")} \\${c.greenBright("$$$")}| ${c.greenBright(
          "$$"
        )} _| ${c.greenBright("$$")}_ | ${c.greenBright(
          "$$"
        )} \\${c.greenBright("$$$$")}   | ${c.greenBright("$$")}   `
      );
      t3rm.writeln(
        `| ${c.greenBright("$$")}  \\${c.greenBright("$")} | ${c.greenBright(
          "$$"
        )}|   ${c.greenBright("$$")} \\| ${c.greenBright(
          "$$"
        )}  \\${c.greenBright("$$$")}   | ${c.greenBright("$$")}   `
      );
      t3rm.writeln(
        ` \\${c.greenBright("$$")}      \\${c.greenBright(
          "$$"
        )} \\${c.greenBright("$$$$$$")} \\${c.greenBright(
          "$$"
        )}   \\${c.greenBright("$$")}    \\${c.greenBright("$$")}   \n`
      );
      t3rm.writeln(
        `${c.grey(
          `Example Metadata URI:\n${ipfsUrl(
            "QmZ7FYSR6UEyZP6fsmqipFpjNz3MWnMR4kpmXawtpF9NsU"
          )}\n`
        )}`
      );

      t3rm.writeln("Mint from:");
      t3rm.writeln(`${c.yellowBright(state.web3.account)}\n`);

      t3rm.writeln("Chain ID:");
      t3rm.writeln(`${c.yellowBright(state.web3.chainId)}\n`);

      let mintFeeUint;
      try {
        mintFeeUint = await state.web3.contract.mintFee();
      } catch (err) {
        console.log(err);
      }
      let mintFee = ethers.utils.formatEther(mintFeeUint);
      mintFee = Math.round(mintFee * 1e8) / 1e8;

      t3rm.writeln("Registration fee:");
      t3rm.writeln(`${c.yellowBright(`${mintFee}Ξ`)}\n`);
      t3rm.write("Command name: ");
      return;
    }

    if (state.mint === null) {
      let isAvailable = true;

      try {
        await state.web3.contract.code(args[0]);
        isAvailable = false;
      } catch (err) {}

      if (isAvailable) {
        t3rm.write("Metadata URI: ");
        t3rm.write("ipfs://");
        state.mint = args[0];
        return;
      }

      t3rm.writeln("Name in use.\n");
      t3rm.write("Command name: ");
      return;
    }

    try {
      const mintFeeUint = await state.web3.contract.mintFee();
      await state.web3.contract.mint(state.mint, args[0], {
        value: mintFeeUint,
      });
    } catch (err) {
      t3rm.writeln("Error minting.");
      console.error(err);
    }
    t3rm.writeln("");
    t3rm.writeln(c.bgYellowBright(c.black("Minted.")));
    delete state.mint;
    exit();
  },
  help: async () => {
    clear(true);
    t3rm.writeln(`Welcome to the interplanetary terminal.\n`);
    t3rm.writeln(c.bgWhiteBright(c.black(" DEVELOPERS ")));
    t3rm.writeln("- Full root-access privileges.");
    t3rm.writeln("- Source code lives forever on IPFS.");
    t3rm.writeln("- Frozen multihashes are immutable.");
    t3rm.writeln("");
    t3rm.writeln(c.bgWhiteBright(c.black(" COLLECTORS ")));
    t3rm.writeln("- Each command is minted as an NFT.");
    t3rm.writeln("- Auto-pricing targets 3 tokens/day. \n");
    t3rm.writeln(c.bgRed("Always verify the source code. DYOR."));
    t3rm.writeln("");
    t3rm.writeln(`Type ${c.yellowBright("LIST")} to hack the galaxy.\n`);
    exit();
  },
  list: async () => {
    const len = 32;
    const title = "COMMAND LIST";
    const padHeader = [...new Array(Math.floor((len - title.length - 4) / 2))]
      .map((_) => "═")
      .join("");
    const headerRaw = `╔${padHeader}${` ${title} `}${padHeader}╗`;
    const header = `╔${padHeader}${c.bgWhiteBright(
      c.black(` ${title} `)
    )}${padHeader}╗`;

    const cmdList = [
      ["CONNECT", "Web3 signin"],
      ["DISCONNECT", "Web3 signout"],
      ["HELP", "About t3rm.dev"],
      ["LIST", "View commands"],
      ["MINT", "Mint command"],
      ["UPDATE", "Update multihash"],
      ["FREEZE", "Lock multihash"],
    ];
    const contentCmd = cmdList
      .map(([cmd, desc]) => {
        const lineRaw = `- ${cmd}: ${desc}`;
        const line = `- ${c.yellowBright(cmd)}: ${desc}`;
        const padLine = [...new Array(headerRaw.length - lineRaw.length - 2)]
          .map((_) => " ")
          .join("");
        return `║${line}${padLine}║\n`;
      })
      .join("");

    const keyList = [
      ["<esc>", "Exit"],
      ["<ctrl+L>", "Clear screen"],
      ["<ctrl+K>", "Clear line"],
      ["<arrow up>", "Prev cmd"],
      ["<arrow down>", "Next cmd"],
    ];
    const contentKey = keyList
      .map(([key, desc]) => {
        const lineRaw = `- ${key}: ${desc}`;
        const line = `- ${c.redBright(key)}: ${desc}`;
        const padLine = [...new Array(headerRaw.length - lineRaw.length - 2)]
          .map((_) => " ")
          .join("");
        return `║${line}${padLine}║\n`;
      })
      .join("");

    const padFooter = [...new Array(headerRaw.length - 2)]
      .map((_) => "═")
      .join("");

    clear(true);
    t3rm.writeln(header);
    t3rm.write(contentCmd);
    t3rm.write(contentKey);
    t3rm.writeln(`╚${padFooter}╝\n`);

    exit();
  },
};

const onCmd = async (data) => {
  const args = data.split(" ");
  const cmd = args[0].toLowerCase();

  if (state.t3rm.run) return cmds[state.t3rm.run](false, args);
  if (!(cmd in cmds)) {
    if (state.web3.contract) {
      try {
        const metaHash = (await state.web3.contract.code(cmd)).split(
          "ipfs://"
        )[1];
        const metaJson = await (await fetch(ipfsUrl(metaHash))).json();

        const codeHash = metaJson["code"].split("ipfs://")[1];
        const code = await (await fetch(ipfsUrl(codeHash))).text();
        cmds[cmd] = eval(`async (firstRun, args) => {${code}}`);

        state.t3rm.run = cmd;
        return cmds[cmd](true, args.slice(1));
      } catch (err) {
        console.log(err);
      }
    }
    t3rm.writeln(`Unknown command: ${cmd}`);
    exit();
    return;
  }
  state.t3rm.run = cmd;
  cmds[cmd](true, args.slice(1));
};

const defaultOnKeyHandler = async ({ key, domEvent }) => {
  switch (true) {
    case domEvent.key === "Escape": {
      exit();
      break;
    }
    case key === "\f": {
      // ctrl+l
      // Clear screen
      clear(true);
      t3rm.write(state.t3rm.prompt);
      break;
    }
    case key === "\u000b": {
      // ctrl+k
      // Clear line
      clear();
      t3rm.write(state.t3rm.prompt);
      break;
    }
    case domEvent.key === "Backspace": {
      if (state.t3rm.cursor === 0) break;

      t3rm.write("\b \b");
      if (state.t3rm.cursor - 1 < state.t3rm.line.length - 1) {
        const lineReplace = state.t3rm.line.slice(state.t3rm.cursor) + " ";
        t3rm.write(lineReplace);
        t3rm.write(esc.cursorBackward(lineReplace.length));
      }
      state.t3rm.line =
        state.t3rm.line.slice(0, state.t3rm.cursor - 1) +
        state.t3rm.line.slice(state.t3rm.cursor, state.t3rm.line.length);
      state.t3rm.cursor--;
      break;
    }
  }
};

const defaultOnDataHandler = async (data) => {
  switch (data) {
    case "\u001b[A": {
      // Up Arrow
      if (
        state.t3rm.cmdIdx === state.t3rm.cmdBuffer.length - 1 ||
        state.t3rm.cmdBuffer.length === 0
      )
        break;

      if (state.t3rm.cmdIdx === -1) state.t3rm.lineTemp = state.t3rm.line;

      state.t3rm.cmdIdx++;
      clear();
      t3rm.write(state.t3rm.prompt + state.t3rm.cmdBuffer[state.t3rm.cmdIdx]);
      state.t3rm.cursor = state.t3rm.cmdBuffer[state.t3rm.cmdIdx].length;
      state.t3rm.line = state.t3rm.cmdBuffer[state.t3rm.cmdIdx];

      break;
    }
    case "\u001b[B": {
      // Down Arrow
      if (state.t3rm.cmdIdx < 0 || state.t3rm.cmdBuffer.length === 0) break;

      const newCmdIdx = state.t3rm.cmdIdx - 1;

      clear();
      if (state.t3rm.cmdIdx === 0) {
        state.t3rm.line = state.t3rm.lineTemp;

        t3rm.write(state.t3rm.prompt + state.t3rm.lineTemp);
        state.t3rm.cursor = state.t3rm.lineTemp.length;
        state.t3rm.lineTemp = "";
      } else {
        t3rm.write(state.t3rm.prompt + state.t3rm.cmdBuffer[newCmdIdx]);
        state.t3rm.cursor = state.t3rm.cmdBuffer[newCmdIdx].length;
        state.t3rm.line = state.t3rm.cmdBuffer[newCmdIdx];
      }
      state.t3rm.cmdIdx = newCmdIdx;

      break;
    }
    case "\u001b[D": {
      // Left Arrow
      if (state.t3rm.cursor === 0) break;
      t3rm.write("\u001b[D");
      state.t3rm.cursor--;
      break;
    }
    case "\u001b[C": {
      // Right Arrow
      if (state.t3rm.cursor === state.t3rm.line.length) break;
      t3rm.write("\u001b[C");
      state.t3rm.cursor++;
      break;
    }
    case "\u001b[3~": {
      // Delete
      if (state.t3rm.cursor === state.t3rm.line.length) break;

      const lineReplace = state.t3rm.line.slice(state.t3rm.cursor + 1) + " ";
      t3rm.write(lineReplace);
      t3rm.write(esc.cursorBackward(lineReplace.length));
      state.t3rm.line =
        state.t3rm.line.slice(0, state.t3rm.cursor) +
        state.t3rm.line.slice(state.t3rm.cursor + 1, state.t3rm.line.length);
      break;
    }
    case "\r": {
      // Return
      if (state.t3rm.line.length === 0) break;
      state.t3rm.cmdBuffer = [
        state.t3rm.line,
        ...state.t3rm.cmdBuffer.slice(0, state.t3rm.cmdHistory),
      ];

      t3rm.writeln("");
      await onCmd(state.t3rm.line);
      state.t3rm.line = "";
      state.t3rm.cmdIdx = -1;
      state.t3rm.cursor = 0;
      break;
    }
    default: {
      const dataIn =
        data === " " && state.t3rm.line.length > 0
          ? " "
          : data.replace(/[^ -~]+/g, "").trim();
      if (!dataIn.length) return;
      t3rm.write(dataIn);
      state.t3rm.cursor += dataIn.length;
      state.t3rm.line += dataIn;
    }
  }
};

const onKey = t3rm.onKey(defaultOnKeyHandler);
const onData = t3rm.onData(defaultOnDataHandler);
