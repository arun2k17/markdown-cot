// ChainOfThought.tsx (TypeScript / React)
import * as React from "react";
import {
  makeStyles,
  tokens,
  Button,
  Text,
  Title3,
  Badge,
} from "@fluentui/react-components";
import {
  ChevronDownRegular,
  ChevronRightRegular,
  ThinkingRegular,
  CheckmarkCircleRegular,
} from "@fluentui/react-icons";

type Step = {
  id: string;
  summary: string;
  description?: string;
  order: number;
};

export interface ChainOfThoughtProps {
  id: string;
  title?: string;
  description?: string;
  status?: string; // e.g., "thinking" | "done"
  closed?: boolean;
  steps: Step[];
}

const useStyles = makeStyles({
  cotContainer: {
    border: `2px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalM,
    margin: `${tokens.spacingVerticalM} 0`,
  },
  cotHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
  },
  collapseButton: {
    minWidth: "32px",
    height: "32px",
  },
  statusBadge: {
    marginLeft: "auto",
  },
  cotBody: {
    marginTop: tokens.spacingVerticalM,
  },
  description: {
    color: tokens.colorNeutralForeground2,
    marginBottom: tokens.spacingVerticalM,
  },
  stepsList: {
    listStyle: "none",
    padding: "0",
    margin: "0",
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  stepItem: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  stepHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
  },
  stepNumber: {
    minWidth: "24px",
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalXXS,
  },
  stepDescription: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    whiteSpace: "pre-wrap",
  },
  closedNote: {
    marginTop: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
  },
});

export default function ChainOfThought(props: ChainOfThoughtProps) {
  const {
    id,
    title,
    description,
    status = "thinking",
    closed = false,
    steps,
  } = props;
  const [collapsed, setCollapsed] = React.useState(false);
  const styles = useStyles();

  const statusLabel =
    status === "done" ? "Done" : status === "thinking" ? "Thinking…" : status;

  const statusIcon =
    status === "done" ? <CheckmarkCircleRegular /> : <ThinkingRegular />;
  const statusAppearance = status === "done" ? "filled" : "outline";
  const statusColor = status === "done" ? "success" : "warning";

  return (
    <section
      className={styles.cotContainer}
      data-status={status}
      aria-live={status === "thinking" ? "polite" : "off"}
    >
      <header className={styles.cotHeader}>
        <Button
          appearance="subtle"
          size="small"
          className={styles.collapseButton}
          icon={collapsed ? <ChevronRightRegular /> : <ChevronDownRegular />}
          aria-expanded={!collapsed}
          aria-controls={`${id}-body`}
          onClick={() => setCollapsed((c) => !c)}
        />

        <Title3 as="h3">{title ?? `Chain of Thought (${id})`}</Title3>

        <div className={styles.statusBadge}>
          <Badge
            icon={statusIcon}
            appearance={statusAppearance}
            color={statusColor}
            size="medium"
          >
            {statusLabel}
          </Badge>
        </div>
      </header>

      {!collapsed && (
        <div id={`${id}-body`} className={styles.cotBody}>
          {description && (
            <Text className={styles.description}>{description}</Text>
          )}

          <ol className={styles.stepsList}>
            {steps.map((s) => (
              <li key={s.id} className={styles.stepItem}>
                <div className={styles.stepHeader}>
                  <div className={styles.stepNumber}>{s.order}.</div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>{s.summary}</div>
                    {s.description && (
                      <div className={styles.stepDescription}>
                        {s.description}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {closed && (
            <Text className={styles.closedNote}>
              Group marked <Text weight="semibold">done</Text>. Further CoT
              updates were ignored.
            </Text>
          )}
        </div>
      )}
    </section>
  );
}
