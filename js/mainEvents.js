document.addEventListener("DOMContentLoaded", () => {
    const playButton = document.querySelector(".play-button");
    const closeButton = document.querySelector(".close-button");
    const startButton = document.querySelector(".start-button");
    const stopButton = document.querySelector(".stop-button");
    const reloadButton = document.querySelector(".reload-button");
    const sentLocalStorageButton = document.querySelector(
        ".send-localstorage-data"
    );
    const workArea = document.querySelector(".work");
    const tableArea = document.querySelector(".data-table");

    let animating = false;
    let animArea;
    let square;
    let dx, dy;
    let squareLeft;
    let squareTop;

    playButton.addEventListener("click", playEvent);
    closeButton.addEventListener("click", cancelEvent);

    startButton.addEventListener("click", startAnimation);
    stopButton.addEventListener("click", stopAnimation);
    reloadButton.addEventListener("click", reloadAnimation);
    sentLocalStorageButton.addEventListener("click", sentLocalStorage);

    function playEvent() {
        sendEventToServer("playEvent", { action: "reset" });
        localStorage.removeItem("events");

        if (workArea.style.display != "grid") {
            workArea.style.display = "grid";
        }
        if (square) {
            square.remove();
        }

        animArea = document.querySelector(".anim");
        square = createSquare();

        startButton.style.display = "block";
        reloadButton.style.display = "none";
        stopButton.style.display = "none";
        tableArea.style.display = "none";

        addMessage("Start of the game");
    }

    function cancelEvent() {
        workArea.style.display = "none";
        tableArea.style.display = "table";

        let localStorageData = JSON.parse(localStorage.getItem("events")) || [];

        document.querySelector(".local-storage-data").textContent =
            formatLocalStorageData(localStorageData);

        fetch("./php/events.json")
            .then((response) => response.json())
            .then((serverData) => {
                document.querySelector(".server-data").textContent =
                    formatServerData(serverData);
            })
            .catch((error) =>
                console.error("Error fetching server data:", error)
            );
    }

    function startAnimation() {
        if (!animating) {
            startButton.style.display = "none";
            reloadButton.style.display = "none";
            stopButton.style.display = "block";

            ({ dx, dy } = getRandomSpeed());

            animating = true;
            addMessage("Animation started");

            animateSquare();
        }
    }

    function stopAnimation() {
        startButton.style.display = "none";
        stopButton.style.display = "none";
        reloadButton.style.display = "block";

        animating = false;
        addMessage("Animation stopped");
    }

    function reloadAnimation() {
        if (square) {
            square.remove();
        }
        square = createSquare();
        ({ dx, dy } = getRandomSpeed());
        animating = false;

        stopButton.style.display = "none";
        reloadButton.style.display = "none";
        startButton.style.display = "block";

        addMessage("Animation reloaded");
    }

    function sentLocalStorage() {
        let events = localStorage.getItem("events");
        if (events) {
            fetch("./php/localstorage_event_logger.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: events,
            })
                .then((response) => response.json())
                .then((data) => console.log(data))
                .catch((error) => console.error("Error:", error));

            localStorage.removeItem("events");
        }
    }

    function createSquare() {
        const squareWidth = 10;
        const squareHeight = 10;

        const sq = document.createElement("div");
        sq.style.width = squareWidth + "px";
        sq.style.height = squareHeight + "px";
        sq.style.backgroundColor = "red";
        sq.style.position = "absolute";

        squareLeft =
            getRandomNumber(0, animArea.clientWidth - squareWidth) + "px";
        squareTop = "0px";

        sq.style.left = squareLeft;
        sq.style.top = squareTop;

        animArea.appendChild(sq);
        return sq;
    }

    function animateSquare() {
        if (!animating) return;

        let rect = square.getBoundingClientRect();
        let animRect = animArea.getBoundingClientRect();

        let newLeft = rect.left - animRect.left + dx;
        let newRight = rect.right - animRect.left + dx;
        let newTop = rect.top - animRect.top + dy;
        let newBottom = rect.bottom - animRect.top + dy;

        if (newLeft <= 0 || newRight >= animRect.width) {
            dx = -dx;
            addMessage("Hitting a horizontal wall");
        }

        if (newTop <= 0) {
            dy = -dy;
        } else if (newBottom >= animRect.height) {
            addMessage("Hitting the bottom wall");
            stopAnimation();

            square.remove();
            square = null;

            stopButton.style.display = "none";
            startButton.style.display = "none";
            reloadButton.style.display = "block";
            return;
        }

        square.style.left = rect.left - animRect.left + dx + "px";
        square.style.top = rect.top - animRect.top + dy + "px";

        requestAnimationFrame(animateSquare);
    }

    function getRandomSpeed() {
        let dx;
        let dy;

        do {
            dx = getRandomNumber(-12, 12);
        } while (Math.abs(dx) < 8);

        do {
            dy = getRandomNumber(-12, 12);
        } while (Math.abs(dy) < 8);

        return { dx, dy };
    }

    function getRandomNumber(min, max) {
        return Math.random() * (max - min) + min;
    }

    function addMessage(message) {
        const messageContainer = document.querySelector(".message-container");
        messageContainer.textContent = message;
        sendEventToServer(message, { dx, dy });
        storeEventLocally(message, { dx, dy });
    }

    function sendEventToServer(eventType, eventData) {
        fetch("./php/event_logger.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: eventType,
                data: eventData,
                timestamp: new Date().toISOString(),
            }),
        })
            .then((response) => response.json())
            .then((data) => console.log(data))
            .catch((error) => console.error("Error:", error));
    }

    function storeEventLocally(eventType, eventData) {
        let events = JSON.parse(localStorage.getItem("events")) || [];
        let eventId = events.length + 1;

        let newEvent = {
            id: eventId,
            type: eventType,
            data: eventData,
            localTimestamp: new Date().toISOString(),
        };

        events.push(newEvent);
        localStorage.setItem("events", JSON.stringify(events));
    }

    function formatLocalStorageData(dataArray) {
        return dataArray
            .map((item) => {
                return (
                    `Event ID: ${item.id}\n` +
                    `Type: ${item.type}\n` +
                    `DX: ${item.data.dx}\n` +
                    `DY: ${item.data.dy}\n` +
                    `Local Timestamp: ${item.localTimestamp}\n\n`
                );
            })
            .join("\n");
    }

    function formatServerData(dataArray) {
        return dataArray
            .map((item) => {
                return (
                    `Event ID: ${item.id}\n` +
                    `Type: ${item.type}\n` +
                    `DX: ${item.data.dx}\n` +
                    `DY: ${item.data.dy}\n` +
                    `Timestamp: ${item.timestamp}\n` +
                    `Server Timestamp: ${item.serverTimestamp}\n\n`
                );
            })
            .join("\n");
    }
});
