import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  FluentProvider,
  webLightTheme,
  Card,
  CardHeader,
  Text,
  Title2,
  Textarea,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  DocumentRegular,
  CodeTextRegular,
  DarkThemeRegular,
  LightbulbRegular,
  ThinkingRegular,
} from "@fluentui/react-icons";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import remarkCot from "./remark-cot";
import CotGroupWrapper from "./CotGroupWrapper";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    padding: tokens.spacingVerticalL,
    gap: tokens.spacingVerticalXL,
    width: "100%",
    maxWidth: "none",
  },
  logoContainer: {
    display: "flex",
    gap: tokens.spacingHorizontalXL,
    alignItems: "center",
    marginBottom: tokens.spacingVerticalL,
  },
  logo: {
    height: "6em",
    padding: tokens.spacingHorizontalL,
    transition: "filter 300ms",
    "&:hover": {
      filter: "drop-shadow(0 0 2em #646cffaa)",
    },
  },
  reactLogo: {
    "&:hover": {
      filter: "drop-shadow(0 0 2em #61dafbaa)",
    },
  },
  headerCard: {
    width: "100%",
  },
  markdownCard: {
    width: "100%",
    marginTop: tokens.spacingVerticalXL,
  },
  markdownContent: {
    textAlign: "left",
    padding: tokens.spacingVerticalL,
    "& h1": {
      color: tokens.colorBrandForeground1,
      borderBottom: `2px solid ${tokens.colorBrandForeground1}`,
      paddingBottom: tokens.spacingVerticalS,
    },
    "& h2": {
      color: tokens.colorNeutralForeground1,
      marginTop: tokens.spacingVerticalXL,
    },
    "& h3": {
      color: tokens.colorNeutralForeground2,
      marginTop: tokens.spacingVerticalL,
    },
    "& pre": {
      backgroundColor: tokens.colorNeutralBackground3,
      padding: tokens.spacingVerticalM,
      borderRadius: tokens.borderRadiusMedium,
      overflowX: "auto",
    },
    "& code": {
      backgroundColor: tokens.colorNeutralBackground2,
      padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
      borderRadius: tokens.borderRadiusSmall,
      fontFamily: "monospace",
    },
    "& pre code": {
      backgroundColor: "transparent",
      padding: "0",
    },
    "& blockquote": {
      borderLeft: `4px solid ${tokens.colorBrandForeground1}`,
      marginLeft: "0",
      paddingLeft: tokens.spacingHorizontalM,
      fontStyle: "italic",
      color: tokens.colorNeutralForeground2,
    },
    "& table": {
      borderCollapse: "collapse",
      width: "100%",
      margin: `${tokens.spacingVerticalM} 0`,
    },
    "& th, & td": {
      border: `1px solid ${tokens.colorNeutralStroke2}`,
      padding: tokens.spacingVerticalS,
      textAlign: "left",
    },
    "& th": {
      backgroundColor: tokens.colorNeutralBackground2,
      fontWeight: tokens.fontWeightSemibold,
    },
    "& a": {
      color: tokens.colorBrandForeground1,
      textDecoration: "none",
      "&:hover": {
        textDecoration: "underline",
      },
    },
  },
  themeToggle: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  editorCard: {
    width: "100%",
    marginTop: tokens.spacingVerticalXL,
  },
  editorTextarea: {
    minHeight: "500px",
    width: "100%",
    fontFamily: "monospace",
    fontSize: tokens.fontSizeBase300,
  },
  cotBlock: {
    border: `2px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalM,
    margin: `${tokens.spacingVerticalM} 0`,
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
    "& .cot-icon": {
      color: tokens.colorNeutralForeground2,
      marginTop: tokens.spacingVerticalXXS,
    },
    "& .cot-content": {
      flex: 1,
      color: tokens.colorNeutralForeground1,
      lineHeight: tokens.lineHeightBase300,
    },
  },
});

function App() {
  const [markdownContent, setMarkdownContent] = useState(`
Try editing this markdown content and see it rendered in real-time!

\`\`\`cot-init {group=demo title="Demo Problem" status=thinking}
Let's demonstrate the advanced COT functionality with a sample problem.
\`\`\`

\`\`\`cot-step {group=demo id=step1}
First step of reasoning

This is where we break down the problem into manageable pieces.
\`\`\`

\`\`\`cot-step {group=demo id=step2}
Second step of reasoning

Here we build on our previous understanding and move forward.
\`\`\`

\`\`\`cot-summary {group=demo status=done}
Problem solved!

We've successfully demonstrated both simple and advanced COT blocks.
\`\`\`

`);
  const styles = useStyles();

  // Combine with the custom element mapping for the remark plugin
  const allComponents = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "cot-group": CotGroupWrapper as any,
  };

  return (
    <FluentProvider theme={webLightTheme}>
      <div className={styles.container}>
        <Card className={styles.editorCard}>
          <CardHeader
            image={<CodeTextRegular />}
            header={<Title2>Markdown Editor</Title2>}
            description={
              <Text>
                Edit the markdown content below to see it rendered in real-time
              </Text>
            }
          />
          <div style={{ padding: tokens.spacingVerticalM }}>
            <Textarea
              className={styles.editorTextarea}
              value={markdownContent}
              onChange={(_, data) => setMarkdownContent(data.value)}
              placeholder="Enter your markdown content here..."
              resize="vertical"
            />
          </div>
        </Card>

        <Card className={styles.markdownCard}>
          <CardHeader
            image={<DocumentRegular />}
            header={<Title2>Rendered Output</Title2>}
            description={
              <Text>Live preview of your markdown with COT support</Text>
            }
          />
          <div className={styles.markdownContent}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkCot]}
              rehypePlugins={[rehypeRaw]}
              components={allComponents}
            >
              {markdownContent}
            </ReactMarkdown>
          </div>
        </Card>
      </div>
    </FluentProvider>
  );
}

export default App;
