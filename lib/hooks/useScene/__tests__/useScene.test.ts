import { act, renderHook } from "@testing-library/react-hooks";
import Peer from "peerjs";
import {
  ILineObject,
  ObjectType,
} from "../../../components/DrawArea/hooks/useDrawing";
import { ManagerMode } from "../../../components/Manager/Manager";
import { useCharacters } from "../../../contexts/CharactersContext/CharactersContext";
import { defaultSceneName } from "../../../contexts/SceneContext/ScenesContext";
import { AspectType } from "../AspectType";
import { IScene } from "../IScene";
import { useScene } from "../useScene";

fdescribe("useScene", () => {
  it("constructor", () => {
    // GIVEN
    const userId = "111";
    const gameId = undefined;
    const useCharactersMock = mockUseCharacters();

    const expectDefaultScene: IScene = {
      id: expect.anything(),
      name: defaultSceneName,
      group: undefined,
      aspects: {},
      gm: {
        id: "111",
        playerName: "Game Master",
        rolls: [],
        playedDuringTurn: false,
        fatePoints: 3,
        offline: false,
        isGM: true,
      },
      players: [],
      goodConfetti: 0,
      badConfetti: 0,
      sort: false,
      drawAreaObjects: [],
      version: 1,
      lastUpdated: expect.anything(),
    };
    // WHEN
    const { result } = renderHook(() => {
      const charactersManager = useCharactersMock();
      return useScene({
        userId,
        gameId,
        charactersManager,
      });
    });
    // THEN
    expect(result.current.state.scene).toEqual(expectDefaultScene);
  });

  describe("dirty", () => {
    it("should set the name", () => {
      // GIVEN
      const userId = "111";
      const gameId = undefined;
      const useCharactersMock = mockUseCharacters();

      // WHEN
      const { result, rerender } = renderHook((props) => {
        const charactersManager = useCharactersMock();
        return useScene({
          userId,
          gameId,
          charactersManager,
        });
      });

      // THEN
      expect(result.current.state.scene.name).toEqual(defaultSceneName);
      expect(result.current.state.dirty).toEqual(false);

      // GIVEN
      const sceneToLoad = {
        id: "new-id",
        group: undefined,
        aspects: { "aspect-id": { toto: 3 } as any },
        lastUpdated: 111,
        name: "new name",
        version: 3,
      };
      // WHEN
      act(() => {
        result.current.actions.loadScene(sceneToLoad, true);
      });

      // THEN
      expect(result.current.state.scene).toEqual({
        aspects: { "aspect-id": { toto: 3 } },
        badConfetti: 0,
        drawAreaObjects: [],
        gm: {
          fatePoints: 3,
          id: "111",
          playedDuringTurn: false,
          playerName: "Game Master",
          rolls: [],
          offline: false,
          isGM: true,
        },
        goodConfetti: 0,
        id: "new-id",
        lastUpdated: 111,
        name: "new name",
        players: [],
        sort: false,
        version: 3,
      });

      // WHEN name is different
      act(() => {
        result.current.actions.updateName("New Name from input");
      });

      // THEN dirty is true
      expect(result.current.state.dirty).toEqual(true);

      // WHEN reload the same scene
      act(() => {
        result.current.actions.loadScene(sceneToLoad, true);
      });

      // THEN dirty is false
      expect(result.current.state.dirty).toEqual(false);

      // WHEN name is different
      act(() => {
        result.current.actions.addAspect(AspectType.Aspect);
      });
      // THEN dirty is true
      expect(result.current.state.dirty).toEqual(true);

      // WHEN reload
      act(() => {
        result.current.actions.loadScene(
          {
            id: "new-id",
            group: undefined,
            aspects: { "aspect-id": { toto: 3 } as any },
            lastUpdated: 111,
            name: "new name",
            version: 3,
          },
          true
        );
      });
      // THEN dirty is false
      expect(result.current.state.dirty).toEqual(false);
    });
  });
  describe("setName", () => {
    it("should set the name", () => {
      // GIVEN
      const userId = "111";
      const gameId = undefined;
      const useCharactersMock = mockUseCharacters();

      // WHEN
      const { result } = renderHook(() => {
        const charactersManager = useCharactersMock();
        return useScene({
          userId,
          gameId,
          charactersManager,
        });
      });
      act(() => {
        result.current.actions.updateName("New Name");
      });
      // THEN
      expect(result.current.state.scene.name).toEqual("New Name");
      expect(result.current.state.dirty).toEqual(false);
    });
  });

  describe("aspects", () => {
    it("should be able to manage aspects", () => {
      // GIVEN
      const userId = "111";
      const gameId = undefined;
      const useCharactersMock = mockUseCharacters();

      // WHEN initial render
      const { result } = renderHook(() => {
        const charactersManager = useCharactersMock();
        return useScene({
          userId,
          gameId,
          charactersManager,
        });
      });
      act(() => {
        // WHEN adding an aspect
        result.current.actions.addAspect(AspectType.Aspect);
      });
      // THEN aspect exists
      const [firstAspectId] = Object.keys(result.current.state.scene.aspects);

      expect(result.current.state.scene.aspects[firstAspectId]).toEqual({
        color: "white",
        consequences: [],
        content: "<br/>",
        tracks: [],
        playedDuringTurn: false,
        pinned: false,
        title: "",
        hasDrawArea: false,
        type: 0,
      });
      act(() => {
        // WHEN updating the title
        result.current.actions.updateAspectTitle(firstAspectId, "new title");
      });
      // THEN
      expect(result.current.state.scene.aspects[firstAspectId].title).toEqual(
        "new title"
      );
      act(() => {
        // WHEN updating the content
        result.current.actions.updateAspectContent(
          firstAspectId,
          "new content"
        );
      });
      // THEN
      expect(result.current.state.scene.aspects[firstAspectId].content).toEqual(
        "new content"
      );
      act(() => {
        // WHEN adding free invoke
        result.current.actions.addAspectTrack(firstAspectId, "Free Invokes");
      });
      // THEN
      expect(
        result.current.state.scene.aspects[firstAspectId].tracks[0]
      ).toEqual({
        name: "Free Invokes",
        value: [{ checked: false, label: "1" }],
      });
      act(() => {
        // WHEN adding a track box
        result.current.actions.addAspectTrackBox(firstAspectId, 0);
      });
      // THEN
      expect(
        result.current.state.scene.aspects[firstAspectId].tracks[0]
      ).toEqual({
        name: "Free Invokes",
        value: [
          { checked: false, label: "1" },
          { checked: false, label: "2" },
        ],
      });
      act(() => {
        // WHEN toggling a track box
        result.current.actions.toggleAspectTrackBox(firstAspectId, 0, 1);
      });
      // THEN
      expect(
        result.current.state.scene.aspects[firstAspectId].tracks[0]
      ).toEqual({
        name: "Free Invokes",
        value: [
          { checked: false, label: "1" },
          { checked: true, label: "2" },
        ],
      });
      act(() => {
        // WHEN setting a box label
        result.current.actions.updateStressBoxLabel(
          firstAspectId,
          0,
          1,
          "my custom label"
        );
      });
      // THEN
      expect(
        result.current.state.scene.aspects[firstAspectId].tracks[0]
      ).toEqual({
        name: "Free Invokes",
        value: [
          { checked: false, label: "1" },
          { checked: true, label: "my custom label" },
        ],
      });
      act(() => {
        // WHEN removing a track box
        result.current.actions.removeAspectTrackBox(firstAspectId, 0);
      });
      // THEN
      expect(
        result.current.state.scene.aspects[firstAspectId].tracks[0]
      ).toEqual({
        name: "Free Invokes",
        value: [{ checked: false, label: "1" }],
      });
      act(() => {
        // WHEN renaming a track
        result.current.actions.updateAspectTrackName(
          firstAspectId,
          0,
          "Countdown"
        );
      });
      // THEN
      expect(
        result.current.state.scene.aspects[firstAspectId].tracks[0]
      ).toEqual({
        name: "Countdown",
        value: [{ checked: false, label: "1" }],
      });
      act(() => {
        // WHEN removing a track
        result.current.actions.removeAspectTrack(firstAspectId, 0);
      });
      // THEN
      expect(result.current.state.scene.aspects[firstAspectId].tracks).toEqual(
        []
      );
      act(() => {
        // WHEN adding consequence
        result.current.actions.addAspectConsequence(firstAspectId);
      });
      // THEN
      expect(
        result.current.state.scene.aspects[firstAspectId].consequences
      ).toEqual([{ name: "", value: "" }]);
      act(() => {
        // WHEN updating consequence
        result.current.actions.updateAspectConsequenceValue(
          firstAspectId,
          0,
          "new consequence"
        );
      });
      // THEN
      expect(
        result.current.state.scene.aspects[firstAspectId].consequences
      ).toEqual([
        {
          name: "",
          value: "new consequence",
        },
      ]);
      act(() => {
        // WHEN updating consequence name
        result.current.actions.updateAspectConsequenceName(
          firstAspectId,
          0,
          "Physical Stress"
        );
      });
      // THEN
      expect(
        result.current.state.scene.aspects[firstAspectId].consequences
      ).toEqual([
        {
          name: "Physical Stress",
          value: "new consequence",
        },
      ]);
      act(() => {
        // WHEN removing consequence
        result.current.actions.removeAspectConsequence(firstAspectId, 0);
      });
      // THEN
      expect(
        result.current.state.scene.aspects[firstAspectId].consequences
      ).toEqual([]);
      act(() => {
        // WHEN updating initiative
        result.current.actions.updateAspectPlayerDuringTurn(
          firstAspectId,
          true
        );
      });

      // THEN
      expect(
        result.current.state.scene.aspects[firstAspectId].playedDuringTurn
      ).toEqual(true);
      act(() => {
        // WHEN reseting initiative
        result.current.actions.resetInitiative();
      });
      expect(
        result.current.state.scene.aspects[firstAspectId].playedDuringTurn
      ).toEqual(false);
      act(() => {
        // WHEN updating color
        result.current.actions.updateAspectColor(firstAspectId, "blue");
      });
      // THEN
      expect(result.current.state.scene.aspects[firstAspectId].color).toEqual(
        "blue"
      );
      act(() => {
        // WHEN reseting aspect
        result.current.actions.resetAspect(firstAspectId);
      });
      // THEN
      expect(result.current.state.scene.aspects[firstAspectId]).toEqual({
        color: "white",
        consequences: [],
        hasDrawArea: false,
        content: "<br/>",
        tracks: [],
        playedDuringTurn: false,
        pinned: false,
        title: "",
        type: AspectType.Aspect,
      });
      act(() => {
        // WHEN removing aspect
        result.current.actions.removeAspect(firstAspectId);
      });
      // THEN
      expect(result.current.state.scene.aspects).toEqual({});
    });
  });

  describe("players", () => {
    it("should map connections to players", () => {
      // GIVEN
      const userId = "111";
      const gameId = undefined;
      const useCharactersMock = mockUseCharacters();

      // WHEN initial render
      const { result } = renderHook(() => {
        const charactersManager = useCharactersMock();
        return useScene({
          userId,
          gameId,
          charactersManager,
        });
      });
      // WHEN initial connection with a player
      act(() => {
        result.current.actions.updatePlayersWithConnections([
          {
            label: "1",
            metadata: {
              playerName: "RP",
            },
          },
        ] as Array<Peer.DataConnection>);
      });
      // THEN
      expect(result.current.state.scene.players[0]).toEqual({
        character: undefined,
        fatePoints: 3,
        id: "1",
        playedDuringTurn: false,
        offline: false,
        playerName: "RP",
        rolls: [],
      });
      // WHEN player plays (fp, rolls, initiative)
      act(() => {
        result.current.actions.updatePlayerPlayedDuringTurn("1", true);
        result.current.actions.updatePlayerRoll("1", {
          rolls: [1, 1, 1, 1],
          total: 4,
        });
        result.current.actions.updatePlayerFatePoints("1", 1);
      });
      // THEN connection mappings reflects that
      expect(result.current.state.scene.players[0]).toEqual({
        character: undefined,
        fatePoints: 1,
        id: "1",
        playedDuringTurn: true,
        offline: false,
        playerName: "RP",
        rolls: [
          {
            rolls: [1, 1, 1, 1],
            total: 4,
          },
        ],
      });
      act(() => {
        // WHEN reseting initiative
        result.current.actions.resetInitiative();
      });
      // THEN initiative is reset
      expect(result.current.state.scene.players[0]).toEqual({
        character: undefined,
        fatePoints: 1,
        id: "1",
        playedDuringTurn: false,
        offline: false,
        playerName: "RP",
        rolls: [
          {
            rolls: [1, 1, 1, 1],
            total: 4,
          },
        ],
      });
      act(() => {
        // WHEN player adds character sheet
        result.current.actions.updatePlayerCharacter("1", ({
          myCharacter: "my first character",
        } as unknown) as any);
      });
      // THEN player as character
      expect(result.current.state.scene.players[0].character).toEqual({
        myCharacter: "my first character",
      });
      act(() => {
        // WHEN player reloads character sheet
        result.current.actions.updatePlayerCharacter("1", ({
          myCharacter: "my second character",
        } as unknown) as any);
      });
      // THEN player as character
      expect(result.current.state.scene.players[0].character).toEqual({
        myCharacter: "my second character",
      });

      act(() => {
        // WHEN player reloads character sheet
        result.current.actions.updatePlayerCharacter("1", ({
          myCharacter: "my second character",
        } as unknown) as any);
      });
      // THEN player as character
      expect(result.current.state.scene.players[0].character).toEqual({
        myCharacter: "my second character",
      });
    });
    describe("removePlayers sticky connections", () => {
      it("should keep removed players out", () => {
        // GIVEN
        const userId = "111";
        const gameId = undefined;
        const useCharactersMock = mockUseCharacters();

        // WHEN initial render
        const { result } = renderHook(() => {
          const charactersManager = useCharactersMock();
          return useScene({
            userId,
            gameId,
            charactersManager,
          });
        });
        // WHEN initial connection with a player
        act(() => {
          result.current.actions.updatePlayersWithConnections([
            {
              label: "1",
              metadata: {
                playerName: "RP",
              },
            },
            {
              label: "2",
              metadata: {
                playerName: "Xav Bad Connection",
              },
            },
          ] as Array<Peer.DataConnection>);
        });
        // THEN I should have 2 players
        expect(result.current.state.scene.players).toEqual([
          {
            character: undefined,
            fatePoints: 3,
            id: "1",
            playedDuringTurn: false,
            offline: false,
            playerName: "RP",
            rolls: [],
          },
          {
            character: undefined,
            fatePoints: 3,
            id: "2",
            playedDuringTurn: false,
            offline: false,
            playerName: "Xav Bad Connection",
            rolls: [],
          },
        ]);

        // WHEN I kick a bad connection
        act(() => {
          result.current.actions.removePlayer("2");
        });

        // THEN I only have one player
        expect(result.current._.removedPlayers).toEqual(["2"]);
        expect(result.current.state.scene.players).toEqual([
          {
            character: undefined,
            fatePoints: 3,
            id: "1",
            playedDuringTurn: false,
            offline: false,
            playerName: "RP",
            rolls: [],
          },
        ]);

        // WHEN the bad connection joins with a new id
        act(() => {
          result.current.actions.updatePlayersWithConnections([
            {
              label: "1",
              metadata: {
                playerName: "RP",
              },
            },
            {
              label: "2",
              metadata: {
                playerName: "Xav Bad Connection",
              },
            },
            {
              label: "3",
              metadata: {
                playerName: "Xav GOOD",
              },
            },
          ] as Array<Peer.DataConnection>);

          // THEN I only have two player
          expect(result.current.state.scene.players).toEqual([
            {
              character: undefined,
              fatePoints: 3,
              id: "1",
              offline: false,
              playedDuringTurn: false,
              playerName: "RP",
              rolls: [],
            },
          ]);
        });
      });
    });
  });

  describe("sort", () => {
    // GIVEN
    const userId = "111";
    const gameId = undefined;
    const useCharactersMock = mockUseCharacters();

    // WHEN initial render
    const { result } = renderHook(() => {
      const charactersManager = useCharactersMock();
      return useScene({
        userId,
        gameId,
        charactersManager,
      });
    });
    expect(result.current.state.scene.sort).toEqual(false);
    // WHEN toggle sort
    act(() => {
      result.current.actions.toggleSort();
    });
    // THEN
    expect(result.current.state.scene.sort).toEqual(true);
    // WHEN toggle sort
    act(() => {
      result.current.actions.toggleSort();
    });
    // THEN
    expect(result.current.state.scene.sort).toEqual(false);
  });
  describe("draw area", () => {
    // GIVEN
    const userId = "111";
    const gameId = undefined;
    const useCharactersMock = mockUseCharacters();

    // WHEN initial render
    const { result } = renderHook(() => {
      const charactersManager = useCharactersMock();
      return useScene({
        userId,
        gameId,
        charactersManager,
      });
    });
    expect(result.current.state.scene.drawAreaObjects).toEqual([]);
    // WHEN drawing
    act(() => {
      result.current.actions.updateDrawAreaObjects([
        { color: "", points: [], type: ObjectType.Line } as ILineObject,
      ]);
    });
    // THEN
    expect(result.current.state.scene.drawAreaObjects).toEqual([
      { color: "", points: [], type: ObjectType.Line },
    ]);
  });
  describe("confetti", () => {
    // GIVEN
    const userId = "111";
    const gameId = undefined;
    const useCharactersMock = mockUseCharacters();

    // WHEN initial render
    const { result } = renderHook(() => {
      const charactersManager = useCharactersMock();
      return useScene({
        userId,
        gameId,
        charactersManager,
      });
    });
    expect(result.current.state.scene.goodConfetti).toEqual(0);
    expect(result.current.state.scene.badConfetti).toEqual(0);

    // WHEN good confetti
    act(() => {
      result.current.actions.fireGoodConfetti();
    });
    // THEN
    expect(result.current.state.scene.goodConfetti).toEqual(0);
    expect(result.current.state.scene.badConfetti).toEqual(0);
    // WHEN bad confetti
    act(() => {
      result.current.actions.fireBadConfetti();
    });
    // THEN
    expect(result.current.state.scene.goodConfetti).toEqual(0);
    expect(result.current.state.scene.badConfetti).toEqual(0);
  });

  describe("resetScene,", () => {
    it("should reset a scene", () => {
      // GIVEN
      const userId = "111";
      const gameId = undefined;
      const useCharactersMock = mockUseCharacters();

      // WHEN initial render
      const { result } = renderHook(() => {
        const charactersManager = useCharactersMock();
        return useScene({
          userId,
          gameId,
          charactersManager,
        });
      });

      // WHEN setuping scene
      let playerId = "";
      act(() => {
        result.current.actions.updateName("NAME");
        result.current.actions.addAspect(AspectType.Aspect);
        playerId = result.current.actions.addOfflinePlayer("OFFLINE PLAYER");
        result.current.actions.updatePlayerPlayedDuringTurn(playerId, true);
      });
      // THEN
      expect(result.current.state.scene.name).toEqual("NAME");
      expect(Object.keys(result.current.state.scene.aspects).length).toEqual(1);
      expect(result.current.state.scene.players).toEqual([
        {
          character: undefined,
          fatePoints: 3,
          id: playerId,
          playedDuringTurn: true,
          offline: true,
          isGM: false,
          playerName: "OFFLINE PLAYER",
          rolls: [],
        },
      ]);
      // WHEN reseting
      act(() => {
        result.current.actions.resetScene();
      });
      expect(result.current.state.scene.name).toEqual(defaultSceneName);
      expect(Object.keys(result.current.state.scene.aspects).length).toEqual(0);
      expect(result.current.state.scene.players).toEqual([
        {
          character: undefined,
          fatePoints: 3,
          id: playerId,
          playedDuringTurn: false,
          offline: true,
          isGM: false,
          playerName: "OFFLINE PLAYER",
          rolls: [],
        },
      ]);
    });
    it("keep sticky aspects", () => {
      // GIVEN
      const userId = "111";
      const gameId = undefined;
      const useCharactersMock = mockUseCharacters();

      // WHEN initial render
      const { result } = renderHook(() => {
        const charactersManager = useCharactersMock();
        return useScene({
          userId,
          gameId,
          charactersManager,
        });
      });

      // WHEN setuping scene
      let npcAspectId = "";
      act(() => {
        npcAspectId = result.current.actions.addAspect(AspectType.NPC);
        result.current.actions.addAspect(AspectType.Aspect);
        result.current.actions.toggleAspectPinned(npcAspectId);
      });
      // THEN
      expect(Object.keys(result.current.state.scene.aspects).length).toEqual(2);

      // WHEN reseting
      act(() => {
        result.current.actions.resetScene();
      });
      expect(result.current.state.scene.name).toEqual(defaultSceneName);
      expect(Object.keys(result.current.state.scene.aspects).length).toEqual(1);
    });
  });
  describe("safeSetScene", () => {
    // GIVEN
    const userId = "111";
    const gameId = undefined;
    const useCharactersMock = mockUseCharacters();

    // WHEN initial render
    const { result } = renderHook(() => {
      const charactersManager = useCharactersMock();
      return {
        useScene: useScene({
          userId,
          gameId,
          charactersManager,
        }),
        useCharacters: charactersManager,
      };
    });
    // WHEN safeSet with nothing
    act(() => {
      result.current.useScene.actions.safeSetScene(
        (undefined as unknown) as any
      );
    });
    // WHEN safeSet
    act(() => {
      result.current.useScene.actions.safeSetScene(({
        players: [{ character: {} }, { character: {} }],
      } as unknown) as any);
    });
    // THEN
    expect(result.current.useScene.state.scene).toEqual({
      players: [{ character: {} }, { character: {} }],
    });
    expect(
      result.current.useCharacters.actions.updateIfExists
    ).toHaveBeenCalledTimes(2);
  });
  describe("o", () => {
    const userId = "111";
    const gameId = undefined;
    const useCharactersMock = mockUseCharacters();

    // WHEN initial render
    const { result } = renderHook(() => {
      const charactersManager = useCharactersMock();
      return useScene({
        userId,
        gameId,
        charactersManager,
      });
    });
    expect(result.current.state.scene.sort).toEqual(false);
    // WHEN adding an offline character
    let playerId = "";
    act(() => {
      playerId = result.current.actions.addOfflineCharacter(
        ({} as unknown) as any
      );
    });
    // THEN
    expect(result.current.state.scene.players).toEqual([
      {
        character: {},
        fatePoints: undefined,
        id: playerId,
        playedDuringTurn: false,
        isGM: false,
        offline: true,
        playerName: "",
        rolls: [],
      },
    ]);
    // WHEN removing an offline player
    act(() => {
      result.current.actions.removePlayer(playerId);
    });
  });
});

function mockUseCharacters() {
  const result = {
    state: {
      characters: [],
      groups: [],
      mode: ManagerMode.Close,
      managerCallback: undefined,
    },
    actions: {
      add: jest.fn(),
      upsert: jest.fn(),
      updateIfExists: jest.fn(),
      remove: jest.fn(),
      select: jest.fn(),
      clearSelected: jest.fn(),
      closeManager: jest.fn(),
      openManager: jest.fn(),
    },
  } as ReturnType<typeof useCharacters>;
  return () => {
    return result;
  };
}

/*



// GIVEN
const userId = "111";
const gameId = undefined;
const useCharactersMock = mockUseCharacters();

// WHEN initial render
const { result } = renderHook(() => {
  const charactersManager = useCharactersMock();
  return useScene({
    userId,
    gameId,
    charactersManager,
    
  });
});
expect(result.current.state.scene.sort).toEqual(false);
// WHEN toggle sort
act(() => {
  result.current.actions.toggleSort();
});
// THEN
expect(result.current.state.scene.sort).toEqual(true);



*/
