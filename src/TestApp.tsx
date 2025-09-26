import { useState } from "react";
import {
  FluentProvider,
  webLightTheme,
  Button,
  Card,
  CardHeader,
  Text,
  Title1,
  makeStyles,
  tokens,
} from "@fluentui/react-components";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: tokens.spacingVerticalXXL,
    gap: tokens.spacingVerticalXL,
  },
});

function TestApp() {
  const [count, setCount] = useState(0);
  const styles = useStyles();

  return (
    <FluentProvider theme={webLightTheme}>
      <div className={styles.container}>
        <Title1>Test App</Title1>
        <Card>
          <CardHeader
            header={<Text>Simple Test</Text>}
            description={<Text>Testing if Fluent UI renders</Text>}
          />
          <Button appearance="primary" onClick={() => setCount(count + 1)}>
            Count is {count}
          </Button>
        </Card>
        <Text>If you can see this, Fluent UI is working!</Text>
      </div>
    </FluentProvider>
  );
}

export default TestApp;
