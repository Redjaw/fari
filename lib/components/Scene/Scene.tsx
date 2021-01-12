import { css, cx } from "@emotion/css";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import CircularProgress from "@material-ui/core/CircularProgress";
import Collapse from "@material-ui/core/Collapse";
import Container from "@material-ui/core/Container";
import Divider from "@material-ui/core/Divider";
import Fade from "@material-ui/core/Fade";
import FormHelperText from "@material-ui/core/FormHelperText";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import Snackbar from "@material-ui/core/Snackbar";
import { ThemeProvider } from "@material-ui/core/styles";
import useTheme from "@material-ui/core/styles/useTheme";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TextField from "@material-ui/core/TextField";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import AddCircleOutlineIcon from "@material-ui/icons/AddCircleOutline";
import EmojiPeopleIcon from "@material-ui/icons/EmojiPeople";
import ErrorIcon from "@material-ui/icons/Error";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import PersonAddIcon from "@material-ui/icons/PersonAdd";
import RotateLeftIcon from "@material-ui/icons/RotateLeft";
import SaveIcon from "@material-ui/icons/Save";
import SortIcon from "@material-ui/icons/Sort";
import ThumbDownIcon from "@material-ui/icons/ThumbDown";
import ThumbUpIcon from "@material-ui/icons/ThumbUp";
import Alert from "@material-ui/lab/Alert";
import Autocomplete from "@material-ui/lab/Autocomplete";
import React, { useEffect, useRef, useState } from "react";
import { Prompt } from "react-router";
import {
  ICharacter,
  useCharacters,
} from "../../contexts/CharactersContext/CharactersContext";
import { useLogger } from "../../contexts/InjectionsContext/hooks/useLogger";
import {
  ISavableScene,
  useScenes,
} from "../../contexts/SceneContext/ScenesContext";
import { arraySort } from "../../domains/array/arraySort";
import { Dice, IRollDiceOptions } from "../../domains/dice/Dice";
import { Font } from "../../domains/font/Font";
import { useBlockReload } from "../../hooks/useBlockReload/useBlockReload";
import { useButtonTheme } from "../../hooks/useButtonTheme/useButtonTheme";
import { usePeerConnections } from "../../hooks/usePeerJS/usePeerConnections";
import { AspectType } from "../../hooks/useScene/AspectType";
import { IPlayer } from "../../hooks/useScene/IScene";
import { useScene } from "../../hooks/useScene/useScene";
import { useTextColors } from "../../hooks/useTextColors/useTextColors";
import { useTranslate } from "../../hooks/useTranslate/useTranslate";
import { CharacterDialog } from "../../routes/Character/components/CharacterDialog";
import { IPeerActions } from "../../routes/Play/types/IPeerActions";
import { ContentEditable } from "../ContentEditable/ContentEditable";
import { DrawArea } from "../DrawArea/DrawArea";
import { FateLabel } from "../FateLabel/FateLabel";
import { IndexCard } from "../IndexCard/IndexCard";
import { MagicGridContainer } from "../MagicGridContainer/MagicGridContainer";
import { ManagerMode } from "../Manager/Manager";
import { LiveMode, Page } from "../Page/Page";
import { CharacterCard } from "./components/PlayerRow/CharacterCard/CharacterCard";
import { PlayerRow } from "./components/PlayerRow/PlayerRow";

export enum SceneMode {
  PlayOnline,
  PlayOffline,
  Manage,
}

export const paperStyle = css({ borderRadius: "0px" });

type IProps =
  | {
      mode: SceneMode.Manage;
      sceneManager: ReturnType<typeof useScene>;
      scenesManager: ReturnType<typeof useScenes>;
      charactersManager: ReturnType<typeof useCharacters>;
      connectionsManager?: undefined;
      idFromParams?: undefined;
      isLoading?: undefined;
      error?: undefined;
    }
  | {
      mode: SceneMode.PlayOnline;
      sceneManager: ReturnType<typeof useScene>;
      scenesManager: ReturnType<typeof useScenes>;
      charactersManager: ReturnType<typeof useCharacters>;
      connectionsManager: ReturnType<typeof usePeerConnections>;
      userId: string;
      isLoading: boolean;
      error: any;
      shareLink: string;
      idFromParams?: string;
    }
  | {
      mode: SceneMode.PlayOffline;
      sceneManager: ReturnType<typeof useScene>;
      scenesManager: ReturnType<typeof useScenes>;
      charactersManager: ReturnType<typeof useCharacters>;
      connectionsManager?: undefined;
      idFromParams?: undefined;
      isLoading?: undefined;
      error?: undefined;
    };

export const Scene: React.FC<IProps> = (props) => {
  const {
    sceneManager,
    connectionsManager,
    scenesManager,
    charactersManager: charactersManager,
  } = props;

  const theme = useTheme();
  const logger = useLogger();
  const isLGAndUp = useMediaQuery(theme.breakpoints.up("lg"));
  const isMD = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const isSMAndDown = useMediaQuery(theme.breakpoints.down("sm"));
  const errorTheme = useButtonTheme(theme.palette.error.main);
  const textColors = useTextColors(theme.palette.primary.main);
  const { t } = useTranslate();
  const [menuOpen, setMenuOpen] = useState(false);
  const $menu = useRef(null);

  const $shareLinkInputRef = useRef<HTMLInputElement | null>(null);
  const [shareLinkToolTip, setShareLinkToolTip] = useState({ open: false });

  const [characterDialogPlayerId, setCharacterDialogPlayerId] = useState<
    string | undefined
  >(undefined);
  const [showCharacterCards, setShowCharacterCards] = useState(true);

  const [savedSnack, setSavedSnack] = useState(false);

  const isGM = !props.idFromParams;
  const isOffline = props.mode === SceneMode.PlayOffline;

  const isGMHostingOnlineOrOfflineGame =
    props.mode !== SceneMode.Manage && isGM;
  const isGMEditingDirtyScene =
    props.mode === SceneMode.Manage && sceneManager.state.dirty;

  const shouldBlockLeaving =
    isGMHostingOnlineOrOfflineGame || isGMEditingDirtyScene;

  useBlockReload(shouldBlockLeaving);

  useEffect(() => {
    if (shareLinkToolTip.open) {
      const id = setTimeout(() => {
        setShareLinkToolTip({ open: false });
      }, 1000);
      return () => {
        clearTimeout(id);
      };
    }
  }, [shareLinkToolTip]);

  const everyone = [
    sceneManager.state.scene.gm,
    ...sceneManager.state.scene.players,
  ];

  function onLoadScene(newScene: ISavableScene) {
    sceneManager.actions.loadScene(newScene, true);
  }

  function onCloneAndLoadScene(newScene: ISavableScene) {
    sceneManager.actions.cloneAndLoadNewScene(newScene);
  }

  function onGMAddCharacter(character: ICharacter) {
    sceneManager.actions.addOfflineCharacter(character);
  }

  function onPlayerLoadCharacter(character: ICharacter) {
    connectionsManager?.actions.sendToHost<IPeerActions>({
      action: "load-character",
      payload: character,
    });
  }

  function roll(player: IPlayer, options: IRollDiceOptions) {
    if (isGM) {
      sceneManager.actions.updatePlayerRoll(player.id, Dice.roll4DF(options));
    } else {
      connectionsManager?.actions.sendToHost<IPeerActions>({
        action: "roll",
        payload: Dice.roll4DF(options),
      });
    }
  }

  const liveMode = getLiveMode();

  return (
    <Page
      gameId={props.idFromParams}
      live={liveMode}
      liveLabel={sceneManager.state.scene.name.toUpperCase()}
    >
      <Box px="1rem">
        <Prompt
          when={shouldBlockLeaving}
          message={t("manager.leave-without-saving")}
        />
        <Snackbar
          open={savedSnack}
          autoHideDuration={6000}
          onClose={(event, reason) => {
            if (reason === "clickaway") {
              return;
            }
            setSavedSnack(false);
          }}
        >
          <Alert
            severity="success"
            onClose={() => {
              setSavedSnack(false);
            }}
          >
            {t("play-route.scene-saved")}
          </Alert>
        </Snackbar>
        {props.error ? renderPageError() : renderPage()}
      </Box>
    </Page>
  );

  function renderPage() {
    if (props.isLoading) {
      return renderIsLoading();
    }
    return renderPageContent();
  }

  function renderIsLoading() {
    return (
      <Box display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  function renderPageContent() {
    return (
      <Fade in>
        <Box>
          {renderHeader()}
          {props.mode === SceneMode.Manage ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                {renderCharacterCards()}
                {renderAspects()}
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} md={5} lg={3}>
                {renderSidePanel()}
              </Grid>
              <Grid item xs={12} md={7} lg={9}>
                {renderCharacterCards()}
                {renderAspects()}
              </Grid>
            </Grid>
          )}
        </Box>
      </Fade>
    );
  }

  function renderSidePanel() {
    const tokenTitles = sceneManager.state.scene.players.map(
      (p) => (p.character?.name ?? p.playerName) as string
    );
    return (
      <Box display="flex" flexDirection="column" height="100%" pb="1rem">
        <Box
          className={css({
            backgroundColor: theme.palette.primary.main,
            color: textColors.primary,
            borderTopLeftRadius: "4px",
            borderTopRightRadius: "4px",
            minHeight: "4rem",
            padding: ".5rem",
          })}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid
              item
              className={css({
                flex: "1 0 auto",
              })}
            >
              <Typography
                variant="overline"
                className={css({
                  fontSize: ".8rem",
                  lineHeight: Font.lineHeight(0.8),
                  fontWeight: "bold",
                })}
              >
                {t("play-route.players")}
              </Typography>
              <Box>
                <Typography
                  variant="overline"
                  className={css({
                    fontSize: "1.2rem",
                    lineHeight: Font.lineHeight(1.2),
                  })}
                >
                  {sceneManager.state.scene.players.length + 1}
                </Typography>
                <Typography
                  variant="caption"
                  className={css({
                    fontSize: ".8rem",
                    lineHeight: Font.lineHeight(0.8),
                  })}
                >
                  {" "}
                </Typography>
                <Typography
                  variant="caption"
                  className={css({
                    fontSize: ".8rem",
                    lineHeight: Font.lineHeight(0.8),
                  })}
                >
                  {t("play-route.connected")}
                </Typography>
              </Box>
            </Grid>
            <Grid item>
              <Grid container spacing={1}>
                {isGM && (
                  <>
                    <Grid item>
                      <Button
                        data-cy="scene.reset-initiative"
                        onClick={() => {
                          sceneManager.actions.resetInitiative();
                          logger.info("Scene:onResetInitiative");
                        }}
                        variant="contained"
                        color="secondary"
                        endIcon={<EmojiPeopleIcon />}
                      >
                        {t("play-route.reset-initiative")}
                      </Button>
                    </Grid>
                    <Grid item>
                      <Tooltip title={t("play-route.add-character-sheet")}>
                        <span>
                          <Button
                            data-cy="scene.add-gm-character"
                            onClick={() => {
                              charactersManager.actions.openManager(
                                ManagerMode.Use,
                                onGMAddCharacter
                              );
                              logger.info("Scene:addCharacter:GM");
                            }}
                            variant="contained"
                            color="secondary"
                          >
                            <PersonAddIcon />
                            {/* <DescriptionIcon /> */}
                          </Button>
                        </span>
                      </Tooltip>
                    </Grid>
                  </>
                )}
              </Grid>
            </Grid>
          </Grid>
        </Box>

        <Paper className={paperStyle}>
          <TableContainer>
            <Table
              size="small"
              className={css({
                tableLayout: "fixed",
              })}
            >
              <TableHead>{renderPlayerRowHeader()}</TableHead>
              <TableBody>
                {everyone.map((player, playerRowIndex) => {
                  const isMe =
                    props.mode === SceneMode.PlayOnline &&
                    props.userId === player.id;
                  const canControl = isGM || isMe;
                  return (
                    <React.Fragment key={player.id}>
                      <CharacterDialog
                        readonly={!canControl}
                        open={characterDialogPlayerId === player.id}
                        character={player.character}
                        dialog={true}
                        rolls={player.rolls}
                        onRoll={(options) => {
                          roll(player, options);
                        }}
                        onSave={(updatedCharacter) => {
                          if (isGM) {
                            sceneManager.actions.updatePlayerCharacter(
                              player.id,
                              updatedCharacter
                            );
                          } else {
                            connectionsManager?.actions.sendToHost<IPeerActions>(
                              {
                                action: "update-character",
                                payload: updatedCharacter,
                              }
                            );
                          }
                          setCharacterDialogPlayerId(undefined);
                        }}
                        onClose={() => {
                          setCharacterDialogPlayerId(undefined);
                        }}
                      />
                      <PlayerRow
                        data-cy={`scene.player-row.${playerRowIndex}`}
                        key={player.id}
                        isGM={isGM}
                        isMe={isMe}
                        player={player}
                        offline={isOffline}
                        onPlayerRemove={() => {
                          sceneManager.actions.removePlayer(player.id);
                        }}
                        onCharacterSheetOpen={() => {
                          if (player.character) {
                            setCharacterDialogPlayerId(player.id);
                          }
                        }}
                        onLoadCharacterSheet={() => {
                          charactersManager.actions.openManager(
                            ManagerMode.Use,
                            onPlayerLoadCharacter
                          );
                        }}
                        onDiceRoll={(options: IRollDiceOptions) => {
                          roll(player, options);
                        }}
                        onPlayedInTurnOrderChange={(playedInTurnOrder) => {
                          if (isGM) {
                            sceneManager.actions.updatePlayerPlayedDuringTurn(
                              player.id,
                              playedInTurnOrder
                            );
                          } else {
                            connectionsManager?.actions.sendToHost<IPeerActions>(
                              {
                                action: "played-in-turn-order",
                                payload: playedInTurnOrder,
                              }
                            );
                          }
                        }}
                        onFatePointsChange={(fatePoints) => {
                          if (isGM) {
                            sceneManager.actions.updatePlayerFatePoints(
                              player.id,
                              fatePoints
                            );
                          } else {
                            connectionsManager?.actions.sendToHost<IPeerActions>(
                              {
                                action: "update-fate-point",
                                payload: fatePoints,
                              }
                            );
                          }
                        }}
                      />
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        <Paper className={paperStyle}>
          <Divider light />
          <Box>
            <DrawArea
              objects={sceneManager.state.scene.drawAreaObjects}
              readonly={!isGM}
              tokenTitles={tokenTitles}
              onChange={(lines) => {
                sceneManager.actions.updateDrawAreaObjects(lines);
              }}
            />
          </Box>
        </Paper>
      </Box>
    );
  }

  function renderPlayerRowHeader() {
    const tableCellStyle = css({ padding: ".375rem 1rem .375rem 1rem" });
    const firstTableCellStyle = css({ width: "50%" });

    return (
      <TableRow>
        <TableCell
          className={cx(tableCellStyle, firstTableCellStyle)}
          align="left"
        >
          <Typography variant="overline" noWrap>
            {t("play-route.name")}
          </Typography>
        </TableCell>
        <TableCell className={tableCellStyle} align="center">
          <Tooltip title={t("play-route.initiative-tracker")}>
            <Typography variant="overline" noWrap>
              {t("play-route.init")}
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell className={tableCellStyle} align="center">
          <Tooltip title={t("play-route.fate-points")}>
            <Typography variant="overline" noWrap>
              {t("play-route.fp")}
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell className={tableCellStyle} align="right">
          <Typography variant="overline" noWrap>
            {t("play-route.dice")}
          </Typography>
        </TableCell>
      </TableRow>
    );
  }

  function renderCharacterCards() {
    const {
      playersWithCharacterSheets,
      hasPlayersWithCharacterSheets,
    } = sceneManager.computed;

    return (
      <>
        <Collapse in={showCharacterCards && hasPlayersWithCharacterSheets}>
          <Box>
            <MagicGridContainer
              items={playersWithCharacterSheets.length}
              deps={[
                playersWithCharacterSheets.length,
                Object.keys(sceneManager.state.scene.aspects).length,
                showCharacterCards,
              ]}
            >
              {playersWithCharacterSheets.map((player, index) => {
                const isMe =
                  props.mode === SceneMode.PlayOnline &&
                  props.userId === player.id;
                const canControl = isGM || isMe;
                return (
                  <CharacterCard
                    key={player?.id || index}
                    readonly={!canControl}
                    playerName={player.playerName}
                    characterSheet={player.character}
                    onRoll={(options) => {
                      roll(player, options);
                    }}
                    onCharacterDialogOpen={() => {
                      setCharacterDialogPlayerId(player.id);
                    }}
                  />
                );
              })}
            </MagicGridContainer>
          </Box>
          <Box pt="1rem" pb="2rem">
            <Divider />
          </Box>
        </Collapse>
      </>
    );
  }

  function renderAspects() {
    const aspectIds = Object.keys(sceneManager.state.scene.aspects);
    const hasAspects = aspectIds.length > 0;

    const sortedAspectIds = arraySort(aspectIds, [
      function sortByPinned(id) {
        const aspect = sceneManager.state.scene.aspects[id];
        return { value: aspect.pinned, direction: "asc" };
      },
      function sortByType(id) {
        const aspect = sceneManager.state.scene.aspects[id];
        return { value: aspect.type, direction: "asc" };
      },
    ]);
    const aspects = sceneManager.state.scene.sort ? sortedAspectIds : aspectIds;
    const width = isLGAndUp ? "25%" : isMD ? "33%" : "100%";
    return (
      <Box pb="2rem">
        {hasAspects && (
          <MagicGridContainer
            items={aspectIds.length}
            deps={[
              sceneManager.computed.playersWithCharacterSheets.length,
              Object.keys(sceneManager.state.scene.aspects).length,
              showCharacterCards,
            ]}
          >
            {aspects.map((aspectId, index) => {
              return (
                <Box
                  key={aspectId}
                  className={cx(
                    css({
                      width: width,
                      padding: "0 .5rem 1.5rem .5rem",
                    })
                  )}
                >
                  <IndexCard
                    key={aspectId}
                    data-cy={`scene.aspect.${index}`}
                    id={`index-card-${aspectId}`}
                    aspectId={aspectId}
                    readonly={!isGM}
                    sceneManager={sceneManager}
                  />
                </Box>
              );
            })}
          </MagicGridContainer>
        )}
        {!hasAspects && (
          <Box pt="6rem" textAlign="center">
            {isGM ? (
              <Typography variant="h6">
                {t("play-route.click-on-the-")}
                <Button
                  variant="contained"
                  color="primary"
                  className={css({
                    margin: "0 .5rem",
                  })}
                  onClick={() => {
                    sceneManager.actions.addAspect(AspectType.Aspect);
                    logger.info("Scene:addAspectEmpty");
                  }}
                  endIcon={<AddCircleOutlineIcon />}
                >
                  {t("play-route.click-on-the-add-aspect-")}
                </Button>
                {t("play-route.click-on-the-add-aspect-button")}
              </Typography>
            ) : (
              <Typography variant="h6">{t("play-route.no-aspects")}</Typography>
            )}
          </Box>
        )}
      </Box>
    );
  }

  function renderHeader() {
    return (
      <Box pb="2rem">
        <Box pb="2rem">
          {renderManagementActions()}
          <Container maxWidth="sm">
            <Box mb=".5rem">
              <FateLabel
                variant="h4"
                className={css({
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  textAlign: "center",
                })}
              >
                <ContentEditable
                  autoFocus
                  data-cy="scene.name"
                  value={sceneManager.state.scene.name}
                  readonly={!isGM}
                  onChange={(value) => {
                    sceneManager.actions.updateName(value);
                  }}
                />
              </FateLabel>
              <FormHelperText className={css({ textAlign: "right" })}>
                {t("play-route.scene-name")}
              </FormHelperText>
            </Box>
            <Collapse in={!!sceneManager.state.scene.name}>
              <Box>
                <Grid
                  container
                  spacing={2}
                  wrap="nowrap"
                  justify="center"
                  alignItems="flex-end"
                >
                  <Grid item>
                    <FateLabel>{t("play-route.group")}</FateLabel>
                  </Grid>
                  <Grid item xs={8} sm={4}>
                    <Autocomplete
                      freeSolo
                      options={scenesManager.state.groups.filter((g) => {
                        const currentGroup =
                          sceneManager.state.scene.group ?? "";
                        return g.toLowerCase().includes(currentGroup);
                      })}
                      value={sceneManager.state.scene.group ?? ""}
                      onChange={(event, newValue) => {
                        sceneManager.actions.setGroup(newValue);
                      }}
                      inputValue={sceneManager.state.scene.group ?? ""}
                      onInputChange={(event, newInputValue) => {
                        sceneManager.actions.setGroup(newInputValue);
                      }}
                      disabled={!isGM}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="standard"
                          InputProps={{
                            ...params.InputProps,
                            disableUnderline: true,
                          }}
                          data-cy="scene.group"
                          inputProps={{
                            ...params.inputProps,
                            className: css({ padding: "2px" }),
                          }}
                          className={css({
                            borderBottom: `1px solid ${theme.palette.divider}`,
                          })}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </Container>
        </Box>

        <Box>
          {renderGMAspectActions()}
          {renderGMSceneActions()}
          {renderPlayerSceneActions()}
        </Box>
      </Box>
    );
  }

  function renderGMAspectActions() {
    if (!isGM) {
      return null;
    }
    return (
      <Box pb="1rem">
        <Grid container spacing={1} justify="center">
          <Grid item>
            <ButtonGroup
              color="primary"
              variant="contained"
              orientation={isSMAndDown ? "vertical" : "horizontal"}
            >
              <Button
                data-cy="scene.add-aspect"
                onClick={() => {
                  sceneManager.actions.addAspect(AspectType.Aspect);
                  logger.info("Scene:onAddCard:Aspect");
                }}
                endIcon={<AddCircleOutlineIcon />}
              >
                {t("play-route.add-aspect")}
              </Button>
              <Button
                data-cy="scene.add-boost"
                onClick={() => {
                  sceneManager.actions.addAspect(AspectType.Boost);
                  logger.info("Scene:onAddCard:Boost");
                }}
                endIcon={<AddCircleOutlineIcon />}
              >
                {t("play-route.add-boost")}
              </Button>
              <Button
                data-cy="scene.add-npc"
                onClick={() => {
                  sceneManager.actions.addAspect(AspectType.NPC);
                  logger.info("Scene:onAddCard:NPC");
                }}
                endIcon={<AddCircleOutlineIcon />}
              >
                {t("play-route.add-npc")}
              </Button>
              <Button
                data-cy="scene.add-bad-guy"
                onClick={() => {
                  sceneManager.actions.addAspect(AspectType.BadGuy);
                  logger.info("Scene:onAddCard:BadGuy");
                }}
                endIcon={<AddCircleOutlineIcon />}
              >
                {t("play-route.add-bad-guy")}
              </Button>
              <Button
                data-cy="scene.add-index-card"
                onClick={() => {
                  sceneManager.actions.addAspect(AspectType.IndexCard);
                  logger.info("Scene:onAddCard:IndexCard");
                }}
                endIcon={<AddCircleOutlineIcon />}
              >
                {t("play-route.add-index-card")}
              </Button>
            </ButtonGroup>
          </Grid>
        </Grid>
      </Box>
    );
  }

  function renderGMSceneActions() {
    if (!isGM) {
      return null;
    }
    return (
      <Box pb="1rem">
        <Grid container spacing={1} justify="center">
          {props.mode === SceneMode.PlayOnline && (
            <Grid item>
              <Button
                onClick={() => {
                  sceneManager.actions.fireGoodConfetti();
                  logger.info("Scene:onFireGoodConfetti");
                }}
                variant="text"
                color="secondary"
              >
                <ThumbUpIcon />
              </Button>
            </Grid>
          )}
          {props.mode === SceneMode.PlayOnline && (
            <Grid item>
              <Button
                onClick={() => {
                  sceneManager.actions.fireBadConfetti();
                  logger.info("Scene:onFireBadConfetti");
                }}
                variant="text"
                color="secondary"
              >
                <ThumbDownIcon />
              </Button>
            </Grid>
          )}
          <Grid item>
            <Button
              data-cy="scene.sort"
              onClick={() => {
                props.sceneManager.actions.toggleSort();
                logger.info("Scene:onSort");
              }}
              variant="outlined"
              color={
                props.sceneManager.state.scene.sort ? "secondary" : "default"
              }
              endIcon={<SortIcon />}
            >
              {t("play-route.sort")}
            </Button>
          </Grid>
          {props.mode !== SceneMode.Manage && (
            <Grid item>
              <Button
                onClick={() => {
                  setShowCharacterCards((s) => !s);
                  logger.info("Scene:onShowCharacterCards");
                }}
                variant="outlined"
                color={showCharacterCards ? "secondary" : "default"}
                endIcon={<SortIcon />}
              >
                {t("play-route.show-character-cards")}
              </Button>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  }

  function renderCopyGameLink(link: string) {
    return (
      <>
        <input
          ref={$shareLinkInputRef}
          type="text"
          value={link}
          readOnly
          hidden
        />
        <Tooltip open={shareLinkToolTip.open} title="Copied!" placement="top">
          <span>
            <Button
              onClick={() => {
                if (link && $shareLinkInputRef.current) {
                  try {
                    $shareLinkInputRef.current.select();
                    document.execCommand("copy");
                    navigator.clipboard.writeText(link);
                    setShareLinkToolTip({ open: true });
                  } catch (error) {
                    window.open(link, "_blank");
                  }

                  logger.info("Scene:onCopyGameLink");
                }
              }}
              variant="outlined"
              color={shareLinkToolTip.open ? "secondary" : "default"}
              endIcon={<FileCopyIcon />}
            >
              {t("play-route.copy-game-link")}
            </Button>
          </span>
        </Tooltip>
      </>
    );
  }
  function renderPlayerSceneActions() {
    if (isGM) {
      return null;
    }
    return (
      <Box pb="1rem">
        <Grid container spacing={1} justify="center">
          <Grid item>
            <Button
              onClick={() => {
                setShowCharacterCards((s) => !s);
                logger.info("Scene:onShowCharacterCards");
              }}
              variant="outlined"
              color={showCharacterCards ? "secondary" : "default"}
              endIcon={<SortIcon />}
            >
              {t("play-route.show-character-cards")}
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  function renderManagementActions() {
    if (!isGM) {
      return null;
    }

    return (
      <Box pb="1rem">
        <Grid container spacing={1} justify="center" alignItems="center">
          <Grid item>
            <Button
              color="primary"
              data-cy="scene.save"
              endIcon={<SaveIcon />}
              variant={sceneManager.state.dirty ? "contained" : "outlined"}
              onClick={() => {
                scenesManager.actions.upsert(sceneManager.state.scene);
                sceneManager.actions.loadScene(sceneManager.state.scene, true);
                setSavedSnack(true);
                logger.info("Scene:onSave");
              }}
            >
              {t("play-route.save-scene")}
            </Button>
          </Grid>
          <Grid item>
            <ThemeProvider theme={errorTheme}>
              <Button
                variant="text"
                color="primary"
                data-cy="scene.reset"
                endIcon={<ErrorIcon />}
                className={css({ borderRadius: "20px" })}
                onClick={() => {
                  const confirmed = confirm(
                    t("play-route.reset-scene-confirmation")
                  );
                  if (confirmed) {
                    sceneManager.actions.resetScene();
                    logger.info("Scene:onReset");
                  }
                }}
              >
                {t("play-route.reset-scene")}
              </Button>
            </ThemeProvider>
          </Grid>
          {props.mode === SceneMode.PlayOnline && props.shareLink && (
            <Grid item>{renderCopyGameLink(props.shareLink)}</Grid>
          )}
          {props.mode !== SceneMode.Manage && (
            <Grid item>
              <IconButton
                ref={$menu}
                size="small"
                data-cy={`scene.menu`}
                onClick={() => {
                  setMenuOpen(true);
                }}
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={$menu.current}
                keepMounted
                open={menuOpen}
                onClose={() => {
                  setMenuOpen(false);
                }}
              >
                <MenuItem
                  data-cy="scene.load-scene"
                  onClick={() => {
                    scenesManager.actions.openManager(
                      ManagerMode.Use,
                      onLoadScene
                    );
                    setMenuOpen(false);
                    logger.info("Scene:onLoadScene");
                  }}
                >
                  <ListItemIcon className={css({ minWidth: "2rem" })}>
                    <RotateLeftIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={t("play-route.load-scene")} />
                </MenuItem>
                <MenuItem
                  data-cy="scene.clone-and-load-scene"
                  onClick={() => {
                    scenesManager.actions.openManager(
                      ManagerMode.Use,
                      onCloneAndLoadScene
                    );
                    setMenuOpen(false);
                    logger.info("Scene:onCloneAndLoadScene");
                  }}
                >
                  <ListItemIcon className={css({ minWidth: "2rem" })}>
                    <FileCopyIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t("play-route.clone-and-load-scene")}
                  />
                </MenuItem>
              </Menu>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  }

  function renderPageError() {
    return (
      <Box>
        <Box display="flex" justifyContent="center" pb="2rem">
          <Typography variant="h4">{t("play-route.error.title")}</Typography>
        </Box>
        <Box display="flex" justifyContent="center">
          <Typography variant="h6">
            {t("play-route.error.description1")}
          </Typography>
        </Box>
        <Box display="flex" justifyContent="center">
          <Typography variant="h6">
            {t("play-route.error.description2")}
          </Typography>
        </Box>
      </Box>
    );
  }

  function getLiveMode() {
    if (props.mode === SceneMode.PlayOffline) {
      return LiveMode.Live;
    }
    if (props.mode === SceneMode.Manage) {
      return undefined;
    }
    if (props.isLoading) {
      return LiveMode.Connecting;
    }
    return LiveMode.Live;
  }
};

Scene.displayName = "Scene";
