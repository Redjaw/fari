import { css, cx } from "@emotion/css";
import Avatar from "@material-ui/core/Avatar";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import useTheme from "@material-ui/core/styles/useTheme";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import AddCircleOutlineOutlinedIcon from "@material-ui/icons/AddCircleOutlineOutlined";
import DirectionsRunIcon from "@material-ui/icons/DirectionsRun";
import EmojiPeopleIcon from "@material-ui/icons/EmojiPeople";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import NoteAddIcon from "@material-ui/icons/NoteAdd";
import RemoveCircleOutlineOutlinedIcon from "@material-ui/icons/RemoveCircleOutlineOutlined";
import RestorePageIcon from "@material-ui/icons/RestorePage";
import React from "react";
import { useLogger } from "../../../../contexts/InjectionsContext/hooks/useLogger";
import { IDataCyProps } from "../../../../domains/cypress/types/IDataCyProps";
import { IRollDiceOptions } from "../../../../domains/dice/Dice";
import { Font } from "../../../../domains/font/Font";
import { useLightBackground } from "../../../../hooks/useLightBackground/useLightBackground";
import { IPlayer } from "../../../../hooks/useScene/IScene";
import { useTextColors } from "../../../../hooks/useTextColors/useTextColors";
import { useTranslate } from "../../../../hooks/useTranslate/useTranslate";
import { DiceBox } from "../../../DiceBox/DiceBox";

export const PlayerRow: React.FC<
  {
    player: IPlayer;
    isGM: boolean;
    isMe: boolean;
    offline: boolean;

    onDiceRoll(options: IRollDiceOptions): void;
    onPlayedInTurnOrderChange(playedDuringTurn: boolean): void;
    onFatePointsChange(fatePoints: number): void;
    onPlayerRemove(): void;
    onCharacterSheetOpen(): void;
    onLoadCharacterSheet(): void;
  } & IDataCyProps
> = (props) => {
  const theme = useTheme();
  const { t } = useTranslate();
  const logger = useLogger();
  const shouldHighlight = props.isMe && !props.offline;
  const canControl = props.isGM || props.isMe;
  const textColor = useTextColors(theme.palette.background.default);
  const lightBackground = useLightBackground();
  const playedDuringTurnColor = props.player.playedDuringTurn
    ? theme.palette.primary.main
    : textColor.disabled;

  const name =
    props.player?.character?.name ||
    props.player?.playerName ||
    t("play-route.character-name");

  const hasCharacterSheet = !!props.player.character;

  const selectedRowStyle = css({ backgroundColor: lightBackground });
  const playerInfoCellStyle = css({
    padding: "0.7rem",
    borderBottom: "none",
  });
  const controlsRowStyle = css({
    padding: "0 0.7rem",
  });
  const defaultTableCellStyle = css({ border: "none" });
  const borderTableCellStyle = css({ padding: "0" });

  const fatePointsStyle = css({
    background:
      props.player.fatePoints === 0
        ? textColor.disabled
        : theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    transition: theme.transitions.create("background"),
    width: "2rem",
    height: "2rem",
    margin: "0 auto",
  });

  function roll(options: IRollDiceOptions) {
    props.onDiceRoll(options);
    logger.info("ScenePlayer:onDiceRoll");
  }

  return (
    <>
      <TableRow
        data-cy={props["data-cy"]}
        selected={false}
        className={cx({
          [selectedRowStyle]: shouldHighlight,
        })}
      >
        <TableCell className={playerInfoCellStyle} align="left">
          {props.player.isGM ? (
            <Typography
              noWrap
              color="inherit"
              className={css({
                width: "100%",
                textAlign: "left",
                fontSize: "1.2rem",
                lineHeight: Font.lineHeight(1.2),
                fontWeight: props.isMe ? "bold" : "normal",
              })}
            >
              {name}
            </Typography>
          ) : (
            renderCharacterSheetButton()
          )}
        </TableCell>

        <TableCell className={playerInfoCellStyle} align="center">
          <Tooltip
            title={
              props.player.playedDuringTurn
                ? t("player-row.played")
                : t("player-row.not-played")
            }
          >
            <span>
              <IconButton
                data-cy={`${props["data-cy"]}.toggle-initiative`}
                onClick={(e) => {
                  e.stopPropagation();
                  props.onPlayedInTurnOrderChange(
                    !props.player.playedDuringTurn
                  );
                  logger.info("ScenePlayer:onPlayedInTurnOrderChange", {
                    playedDuringTurn: !props.player.playedDuringTurn,
                  });
                }}
                disabled={!canControl}
                size="small"
              >
                {props.player.playedDuringTurn ? (
                  <DirectionsRunIcon htmlColor={playedDuringTurnColor} />
                ) : (
                  <EmojiPeopleIcon htmlColor={playedDuringTurnColor} />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </TableCell>
        <TableCell className={cx(playerInfoCellStyle)} align="center">
          <Tooltip title={t("player-row.fate-points")}>
            <span>
              <ButtonBase
                className={css({
                  borderRadius: "50%",
                })}
                data-cy={`${props["data-cy"]}.consume-fate-point`}
                disabled={!canControl}
                onClick={(e) => {
                  e.stopPropagation();
                  props.onFatePointsChange(props.player.fatePoints - 1);
                  logger.info("ScenePlayer:onConsumeFatePoints");
                }}
              >
                <Avatar className={fatePointsStyle}>
                  {props.player.fatePoints}
                </Avatar>
              </ButtonBase>
            </span>
          </Tooltip>
        </TableCell>
        <TableCell className={cx(playerInfoCellStyle)} align="right">
          <Box display="flex" justifyContent="flex-end">
            <DiceBox
              rolls={props.player.rolls}
              size="2rem"
              fontSize="1.25rem"
              borderSize=".15rem"
              disabled={!canControl}
              onClick={() => {
                roll({});
              }}
            />
          </Box>
        </TableCell>
      </TableRow>
      {renderGMControls()}
      {renderBorder()}
    </>
  );

  function renderCharacterSheetButton() {
    return (
      <>
        <Grid container wrap="nowrap" alignItems="center">
          {props.isMe && (
            <Grid item>
              <Tooltip
                title={
                  hasCharacterSheet
                    ? t("player-row.swap-character-sheet")
                    : t("play-route.add-character-sheet")
                }
                onClick={() => {
                  props.onLoadCharacterSheet();
                  logger.info("ScenePlayer:onCharacterSheetContextButtonPress");
                }}
              >
                <IconButton
                  size="small"
                  color={hasCharacterSheet ? "secondary" : "primary"}
                >
                  {!hasCharacterSheet ? <NoteAddIcon /> : <RestorePageIcon />}
                </IconButton>
              </Tooltip>
            </Grid>
          )}
          <Grid item xs>
            <Button
              className={css({
                width: "100%",
                background: "transparent",
                textTransform: "none",
                color: hasCharacterSheet
                  ? theme.palette.text.primary
                  : theme.palette.text.secondary,
                border: "none",
              })}
              data-cy={`${props["data-cy"]}.open-character-sheet`}
              disabled={!props.player.character}
              size="small"
              onClick={(e) => {
                props.onCharacterSheetOpen();
                logger.info("ScenePlayer:onCharacterSheetButtonPress");
              }}
            >
              <Typography
                noWrap
                color="inherit"
                className={css({
                  width: "100%",
                  textAlign: "left",
                  fontSize: "1.2rem",
                  lineHeight: Font.lineHeight(1.2),
                  fontWeight: props.isMe ? "bold" : "normal",
                })}
              >
                {name}
              </Typography>
            </Button>
          </Grid>
        </Grid>
      </>
    );
  }
  function renderGMControls() {
    if (!props.isGM) {
      return null;
    }

    return (
      <TableRow
        selected={false}
        className={cx(controlsRowStyle, {
          [selectedRowStyle]: shouldHighlight,
        })}
      >
        <TableCell colSpan={4} className={defaultTableCellStyle}>
          <Grid container alignItems="center" justify="flex-end" spacing={1}>
            <Grid item>
              <Tooltip title={t("player-row.remove-fate-point")}>
                <span>
                  <IconButton
                    data-cy={`${props["data-cy"]}.consume-fate-point-gm`}
                    size="small"
                    disabled={props.player.fatePoints === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      const fatePointsMinusOne = props.player.fatePoints - 1;
                      const newValue =
                        fatePointsMinusOne < 0 ? 0 : fatePointsMinusOne;
                      props.onFatePointsChange(newValue);
                      logger.info("ScenePlayer:onGMConsumeFatePoint");
                    }}
                  >
                    <RemoveCircleOutlineOutlinedIcon
                      className={css({ width: "1rem", height: "1rem" })}
                    />
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>

            <Grid item>
              <Tooltip title={t("player-row.add-fate-point")}>
                <IconButton
                  data-cy={`${props["data-cy"]}.refresh-fate-point-gm`}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onFatePointsChange(props.player.fatePoints + 1);
                    logger.info("ScenePlayer:onGMRefreshFatePoint");
                  }}
                >
                  <AddCircleOutlineOutlinedIcon
                    className={css({ width: "1rem", height: "1rem" })}
                  />
                </IconButton>
              </Tooltip>
            </Grid>
            {!props.player.isGM && (
              <Grid item>
                <Tooltip title={t("player-row.remove-character")}>
                  <IconButton
                    data-cy={`${props["data-cy"]}.remove`}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onPlayerRemove();
                      logger.info("ScenePlayer:onPlayerRemove");
                    }}
                  >
                    <HighlightOffIcon
                      color="error"
                      className={css({ width: "1rem", height: "1rem" })}
                    />
                  </IconButton>
                </Tooltip>
              </Grid>
            )}
          </Grid>
        </TableCell>
      </TableRow>
    );
  }

  function renderBorder() {
    return (
      <TableRow>
        <TableCell colSpan={4} className={borderTableCellStyle} />
      </TableRow>
    );
  }
};
PlayerRow.displayName = "PlayerRow";
