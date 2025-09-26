import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  Button,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title1,
  Title2,
  Image,
  Switch,
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

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: tokens.spacingVerticalXXL,
    gap: tokens.spacingVerticalXL,
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
    maxWidth: "600px",
    width: "100%",
  },
  markdownCard: {
    maxWidth: "800px",
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

// Custom COT (Chain of Thought) component
const CotBlock = ({
  children,
  styles,
}: {
  children: React.ReactNode;
  styles: ReturnType<typeof useStyles>;
}) => {
  return (
    <div className={styles.cotBlock}>
      <ThinkingRegular className="cot-icon" />
      <div className="cot-content">{children}</div>
    </div>
  );
};

function App() {
  const [count, setCount] = useState(0);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const styles = useStyles();

  // Custom renderer for code blocks to handle COT blocks
  const customRenderers: Components = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    code: (props: any) => {
      const { inline, className, children } = props;
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";

      if (language === "cot" && !inline) {
        return <CotBlock styles={styles}>{children}</CotBlock>;
      }

      return inline ? (
        <code className={className}>{children}</code>
      ) : (
        <pre>
          <code className={className}>{children}</code>
        </pre>
      );
    },
  };

  const sampleMarkdown = `# Welcome to React Markdown Demo with Fluent UI

This is a **sample markdown** document that demonstrates various features with **Fluent UI v9** styling:

## Chain of Thought (COT) Blocks

This is our custom COT fenced block feature:

\`\`\`cot
This is a chain of thought reasoning block. It helps break down complex problems step by step. For example, when solving a math problem, I would first identify what I know, then determine what I need to find, and finally work through the solution methodically.
\`\`\`

You can use multiple COT blocks to show different thinking processes:

\`\`\`cot
Step 1: Understand the problem requirements
- We need a custom fenced block called "cot"
- It should have a grey border
- It should be styled as a block element in the markdown flow
\`\`\`

\`\`\`cot
Step 2: Implementation approach
- Create a custom renderer for code blocks
- Check if the language is "cot"
- Render with custom COT component using Fluent UI styling
- Add thinking icon to make it visually distinctive
\`\`\`

## Other Features

- **Bold text** and *italic text*
- [Links to external sites](https://react.dev)
- Lists and nested items:
  1. First item
  2. Second item with \`inline code\`
  3. Third item

### Regular Code Blocks

\`\`\`javascript
function greet(name) {
  console.log('Hello, ' + name + '!');
  return 'Welcome to the Fluent UI markdown world with COT support!';
}
\`\`\`

### Blockquotes

> This is a blockquote styled with Fluent UI design tokens. It provides
> emphasis to important information or quotes using the brand colors.

### Tables

| Feature | Status | Notes |
|---------|--------|-------|
| Headers | ✅ | Working with Fluent UI |
| Lists | ✅ | Working with Fluent UI |
| Code blocks | ✅ | Working with Fluent UI |
| Tables | ✅ | Working with Fluent UI |
| Dark Theme | ✅ | Toggle available |
| COT Blocks | ✅ | **NEW!** Custom fenced blocks |

---

**Current count:** ${count}

*Try clicking the button below to see the count update in this markdown!*

\`\`\`cot
The counter demonstrates React state integration with markdown content. Each time the button is clicked, the entire markdown is re-rendered with the updated count value, showing how dynamic content can be seamlessly integrated with static markdown.
\`\`\`
`;

  return (
    <FluentProvider theme={isDarkTheme ? webDarkTheme : webLightTheme}>
      <div className={styles.container}>
        <div className={styles.logoContainer}>
          <a href="https://vite.dev" target="_blank">
            <Image src={viteLogo} className={styles.logo} alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <Image
              src={reactLogo}
              className={`${styles.logo} ${styles.reactLogo}`}
              alt="React logo"
            />
          </a>
        </div>

        <Card className={styles.headerCard}>
          <CardHeader
            image={<DocumentRegular />}
            header={<Title1>Vite + React + Fluent UI</Title1>}
            description={
              <Text>
                Modern React app with Fluent UI design system and markdown
                support
              </Text>
            }
          />
          <CardPreview>
            <div
              style={{
                padding: tokens.spacingVerticalM,
                display: "flex",
                flexDirection: "column",
                gap: tokens.spacingVerticalM,
              }}
            >
              <div className={styles.themeToggle}>
                {isDarkTheme ? <DarkThemeRegular /> : <LightbulbRegular />}
                <Text>Dark theme</Text>
                <Switch
                  checked={isDarkTheme}
                  onChange={(_, data) => setIsDarkTheme(data.checked)}
                />
              </div>

              <Button
                appearance="primary"
                icon={<CodeTextRegular />}
                onClick={() => setCount(count + 1)}
              >
                Count is {count}
              </Button>

              <Text>
                Edit <Text weight="semibold">src/App.tsx</Text> and save to test
                HMR
              </Text>
            </div>
          </CardPreview>
        </Card>

        <Card className={styles.markdownCard}>
          <CardHeader
            image={<DocumentRegular />}
            header={<Title2>Markdown Content</Title2>}
            description={
              <Text>Sample markdown rendered with Fluent UI styling</Text>
            }
          />
          <div className={styles.markdownContent}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={customRenderers}
            >
              {sampleMarkdown}
            </ReactMarkdown>
          </div>
        </Card>
      </div>
    </FluentProvider>
  );
}

export default App;
