export default class MapView {
  #attackPhaseDetails = {
    attackingTerritory: "",
    defendingTerritory: "",
    troopsCount: "",
  };

  #fortificationDetails = {
    fromTerritory: "",
    toTerritory: "",
    troopCount: "",
  };

  #eventBus;
  #listeners = {};
  #attackingTerritories = [];

  constructor(eventBus) {
    this.#eventBus = eventBus;
  }

  #showToast(message) {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "left",
      stopOnFocus: true,
      style: {
        background: "linear-gradient(to right, #303824, #874637)",
      },
    }).showToast();
  }

  #findPlayerColor(playerId, players) {
    const player = players.find((player) => player.id === playerId);
    return player?.colour || "#000";
  }

  #toggleTerritoryHighlight(territoryId, highlight = true) {
    console.log(territoryId, highlight);

    const territory = document.getElementById(territoryId);
    const path = territory.querySelector("path");
    path.classList.toggle("highlight-territory", highlight);
  }

  highlightTerritory(territoryId) {
    this.#toggleTerritoryHighlight(territoryId);
  }

  unHighlightTerritory(territoryId) {
    this.#toggleTerritoryHighlight(territoryId, false);
  }

  #removeClickListeners(territories) {
    territories.forEach((territoryId) => {
      const territory = document.getElementById(territoryId);
      this.#toggleTerritoryHighlight(territoryId, false);
      territory.removeEventListener("click", this.#listeners[territoryId]);
      delete this.#listeners[territoryId];
    });
  }

  #handleTerritoryClick(territoryId, callback, relatedTerritories = []) {
    return () => {
      callback(territoryId);
      this.#removeClickListeners(relatedTerritories);
      this.#toggleTerritoryHighlight(territoryId, true);
    };
  }

  #handleDefendTerritoryClick(territoryId) {
    this.#attackPhaseDetails.attackingTerritory = territoryId;

    this.#eventBus.emit("defendingPlayer", territoryId);
    this.#showToast("Select the number of troops to attack with");

    this.#eventBus.emit("troopsToAttack");
  }

  async #selectDefendingTerritory(attackingTerritoryId) {
    this.#showToast("Selecting defending territory");
    const [response] = this.#eventBus.emit(
      "getDefendingTerritories",
      attackingTerritoryId
    );
    const defendingTerritories = await response;

    defendingTerritories.forEach((territoryId) => {
      const territory = document.getElementById(territoryId);
      this.#toggleTerritoryHighlight(territoryId, true);
      const listener = this.#handleTerritoryClick(
        territoryId,
        () => this.#handleDefendTerritoryClick(territoryId),
        defendingTerritories
      );
      this.#listeners[territoryId] = listener;
      territory.addEventListener("click", listener);
    });
  }
  //-----------------------------attack territory click
  #handleAttackTerritoryClick(territoryId) {
    this.#attackPhaseDetails.attackingTerritory = territoryId;
    this.#selectDefendingTerritory(territoryId);
  }

  handleAttackPhase(attackingTerritories) {
    this.#attackingTerritories = attackingTerritories;
    attackingTerritories.forEach((territoryId) => {
      const territory = document.getElementById(territoryId);
      this.#toggleTerritoryHighlight(territoryId, true);
      const listener = this.#handleTerritoryClick(
        territoryId,
        () =>
          this.#handleAttackTerritoryClick(territoryId, attackingTerritories),
        attackingTerritories
      );
      this.#listeners[territoryId] = listener;
      territory.addEventListener("click", listener);
    });
  }

  stopAttackPhase() {
    this.#removeClickListeners(this.#attackingTerritories);
  }

  updateTerritory({ territory, troopCount }) {
    const domTerritory = document.getElementById(territory);
    const troopsCountDOM = domTerritory.querySelector("tspan");

    troopsCountDOM.textContent = troopCount;
  }

  #changeTerritoryColor(territoryId, color) {
    const territory = document.getElementById(territoryId);
    const path = territory.querySelector("path");

    path.style.fill = color;
  }

  #renderTerritories(territories, players) {
    Object.entries(territories).forEach(
      ([territoryName, { troops, owner }]) => {
        const playerColor = this.#findPlayerColor(owner, players);
        const domTerritory = document.getElementById(territoryName);
        const troopsCountDOM = domTerritory.querySelector("tspan");
        troopsCountDOM.textContent = troops;
        troopsCountDOM.classList.add("troops-bg");

        this.#changeTerritoryColor(territoryName, playerColor);
      }
    );
  }

  render(territories, players) {
    this.#renderTerritories(territories, players);
  }

  #unHighlightTerritories(territories) {
    territories.forEach((territoryId) => {
      this.unHighlightTerritory(territoryId);
    });
  }

  #toastTemplate() {
    //html template
    const div = document.createElement("div");
    div.setAttribute("id", "troops-to-fortify");
    const template = `
    <div>
      <input id="fortify-troops-count-value" type="number" />
      <div id="fortify-place-btn">Fortify</div>
    </div>
    `;
    div.innerHTML = template;
    globalThis.document.body.appendChild(div);
  }

  #removeFortificationTroopsTemplate() {
    globalThis.document.body.removeChild(
      document.getElementById("troops-to-fortify")
    );
  }

  #askTroopsToFortify(callback) {
    this.#toastTemplate();

    const fortifyPlaceButton = document.getElementById("fortify-place-btn");
    fortifyPlaceButton.addEventListener("click", () => {
      const troopsCount = document.getElementById(
        "fortify-troops-count-value"
      ).value;
      callback(troopsCount);
    });
  }

  #resetFortificationPhase() {
    this.unHighlightTerritory(this.#fortificationDetails.toTerritory);
    this.unHighlightTerritory(this.#fortificationDetails.fromTerritory);
    this.#fortificationDetails = {};
    this.#removeFortificationTroopsTemplate();
    this.#eventBus.emit("switchTurn");
  }

  async #sendFortificationData(troopsCount) {
    this.#fortificationDetails.troopCount = troopsCount;
    const [emitResponse] = await this.#eventBus.emit(
      "fortification",
      this.#fortificationDetails
    );
    const fortificationResponse = await emitResponse;

    if (fortificationResponse) {
      return this.#resetFortificationPhase();
    }

    this.#showToast("Invalid Fortification");
  }

  #selectToTerritoryClick(territoryId, territories) {
    return () => {
      this.#fortificationDetails.toTerritory = territoryId;
      this.#removeClickListeners(territories);
      this.#toggleBlinkTerritories(territories, false);
      this.highlightTerritory(territoryId);
      this.highlightTerritory(this.#fortificationDetails.fromTerritory);

      setTimeout(() => {
        this.#askTroopsToFortify(this.#sendFortificationData.bind(this));
      }, 2000);
    };
  }

  #toggleBlinkTerritories(territories, status = true) {
    territories.forEach((territoryId) => {
      const territory = document.getElementById(territoryId);
      const path = territory.querySelector("path");
      if (status) return path.classList.add("blink-territory");

      return path.classList.remove("blink-territory");
    });
  }

  #handleToTerritoryClick(territories) {
    this.#toggleBlinkTerritories(territories);
    territories.forEach((territoryId) => {
      const territory = document.getElementById(territoryId);

      const listner = this.#selectToTerritoryClick(territoryId, territories);
      this.#listeners[territoryId] = listner;

      territory.addEventListener("click", listner, { once: true });
    });
  }

  async #handleConnectedTerritories(territoryId) {
    const [emitResponse] = await this.#eventBus.emit(
      "getConnectedTerritories",
      territoryId
    );
    const connectedTerritories = await emitResponse;

    this.#showToast("Select to territory for fortification");
    this.#handleToTerritoryClick(connectedTerritories);
  }

  #selectFromTerritoryClick(territoryId, territories) {
    return () => {
      this.#fortificationDetails.fromTerritory = territoryId;
      this.#removeClickListeners(territories);
      this.#unHighlightTerritories(territories);
      this.highlightTerritory(territoryId);

      this.#handleConnectedTerritories(territoryId);
    };
  }

  startFortificationPhase(territories) {
    this.#removeClickListeners(territories);
    this.#showToast("Select from territory for fortification");

    territories.forEach((territoryId) => {
      this.highlightTerritory(territoryId);
      const territory = document.getElementById(territoryId);
      const listner = this.#selectFromTerritoryClick(territoryId, territories);
      this.#listeners[territoryId] = listner;

      territory.addEventListener("click", listner, { once: true });
    });
  }

  resetMapEffects() {
    console.log('"resetting');

    const territoryPaths = globalThis.document.querySelectorAll("path");

    territoryPaths.forEach((path) => {
      path.classList.remove("highlight-territory");
    });
  }
}
