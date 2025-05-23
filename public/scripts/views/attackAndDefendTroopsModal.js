export class AttackDefenceModal {
  #eventbus;
  constructor(eventBus) {
    this.#eventbus = eventBus;
  }
  #createDefenderTroopsHtml() {
    return `<div id="troops-to-defend">
              <input id="troops-input" type="text" placeholder="Troops to Defend with" style="width: 200px;" min="1" max="2"/>
              <button id="submit-button" style="margin-left: 5px;">Submit</button>
            </div>
          `;
  }

  #createAttackerTroopsHtml() {
    return `<div id="troops-to-attack">
              <input id="troops-input" type="text" placeholder="Troops to attack With" style="width: 200px;" min="1" max="3"/>
              <button id="submit-button" style="margin-left: 5px;">Submit</button>
            </div>
          `;
  }

  #createFortificationTroopsHtml() {
    return `<div id="troops-to-fortify">
              <input id="troops-input" type="text" placeholder="Troops to move" style="width: 200px;" min="1" max="3"/>
              <button id="submit-button" style="margin-left: 5px;">Submit</button>
            </div>
          `;
  }

  #createToast(createToastHTML) {
    const toastHTML = createToastHTML();
    const myToast = Toastify({
      text: toastHTML,
      duration: -1,
      escapeMarkup: false,
      close: false,
      gravity: "bottom",
      position: "right",
      style: {
        background: "transparent",
        padding: "10px",
      },
    });
    myToast.showToast();
    return myToast;
  }

  showTroopsToDefend() {
    const myToast = this.#createToast(
      this.#createDefenderTroopsHtml.bind(this)
    );
    const input = document.getElementById("troops-input");
    const button = document.getElementById("submit-button");

    button.addEventListener("click", () => {
      myToast.hideToast();
      if (parseInt(input.value) > 2) {
        alert("you can't defend with more than 2");
        return this.showTroopsToDefend();
      }
      this.#eventbus.emit("sendDefenderTroops", parseInt(input.value));
    });
  }

  showTroopsToAttack() {
    const myToast = this.#createToast(
      this.#createAttackerTroopsHtml.bind(this)
    );
    const input = document.getElementById("troops-input");
    const button = document.getElementById("submit-button");

    button.addEventListener("click", () => {
      myToast.hideToast();
      if (parseInt(input.value) > 3) {
        alert("you can't attack with moret tahn 3");
        return this.showTroopsToAttack();
      }
      this.#eventbus.emit("sendAttckerTroops", parseInt(input.value));
    });
  }

  showTroopsToFortification(attackerTerritory, defenderTerritory, maxTroops) {
    const troopsToFortify = document.getElementById("troops-to-fortify");
    if (troopsToFortify) troopsToFortify.innerHTML = "";
    const toast = this.#createToast(
      this.#createFortificationTroopsHtml.bind(this)
    );

    const input = document.getElementById("troops-input");
    const button = document.getElementById("submit-button");
    button.addEventListener("click", () => {
      toast.hideToast();
      const troops = parseInt(input.value);
      if (troops >= maxTroops) {
        alert("keep at least one troop in territory");
        this.showTroopsToFortification(
          attackerTerritory,
          defenderTerritory,
          maxTroops
        );
        return;
      }
      this.#eventbus.emit(
        "TroopsForFortificationInAttack",
        attackerTerritory,
        defenderTerritory,
        troops
      );
    });
  }
}
