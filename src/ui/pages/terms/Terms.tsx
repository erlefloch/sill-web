import { useEffect } from "react";
import { declareComponentKeys } from "i18nifty";
import { useCoreFunctions, useCoreState, selectors } from "core";
import { Markdown } from "keycloakify/tools/Markdown";
import { useLang } from "ui/i18n";
import { makeStyles } from "@codegouvfr/react-dsfr/tss";
import { fr } from "@codegouvfr/react-dsfr";
import type { PageRoute } from "./route";

type Props = {
    className?: string;
    route: PageRoute;
};

export default function Terms(props: Props) {
    const { className } = props;

    const { classes, cx } = useStyles();

    const { termsOfServices } = useCoreFunctions();

    const { lang } = useLang();

    useEffect(() => {
        termsOfServices.initialize({ lang });
    }, [lang]);

    const { markdown } = useCoreState(selectors.termsOfServices.markdown);

    if (markdown === undefined) {
        return null;
    }

    return (
        <div className={cx(classes.root, className)}>
            <Markdown className={classes.markdown}>{markdown}</Markdown>
        </div>
    );
}

export const { i18n } = declareComponentKeys<"no terms">()({
    Terms
});

export const useStyles = makeStyles({ "name": { Terms } })(() => ({
    "root": {
        "display": "flex",
        "justifyContent": "center"
    },
    "markdown": {
        "borderRadius": fr.spacing("2v"),
        "maxWidth": 900,
        "padding": fr.spacing("4v"),
        "&:hover": {
            "boxShadow": "0px 6px 10px 0px rgba(0,0,0,0.14)"
        },
        "marginBottom": fr.spacing("2v")
    }
}));
