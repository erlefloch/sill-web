import { useEffect, useState, useId } from "react";
import { SearchInput } from "ui/shared/SearchInput";
import { fr } from "@codegouvfr/react-dsfr";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { CircularProgressWrapper } from "ui/shared/CircularProgressWrapper";
import { assert } from "tsafe/assert";
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import type { useCoreFunctions } from "core";
import type { FormData } from "core/usecases/softwareForm";
import type { ReturnType } from "tsafe";
import { declareComponentKeys } from "i18nifty";
import { useTranslation } from "ui/i18n";

export type Step2Props = {
    className?: string;
    isUpdateForm: boolean;
    initialFormData: FormData["step2"] | undefined;
    onSubmit: (formData: FormData["step2"]) => void;
    evtActionSubmit: NonPostableEvt<void>;
    getAutofillDataFromWikidata: ReturnType<
        typeof useCoreFunctions
    >["softwareForm"]["getAutofillData"];
    getWikidataOptions: (
        queryString: string
    ) => Promise<
        ReturnType<
            ReturnType<typeof useCoreFunctions>["softwareForm"]["getWikidataOptions"]
        >
    >;
};

export function SoftwareFormStep2(props: Step2Props) {
    const {
        className,
        isUpdateForm,
        initialFormData,
        onSubmit,
        evtActionSubmit,
        getWikidataOptions,
        getAutofillDataFromWikidata
    } = props;

    const { t } = useTranslation({ SoftwareFormStep2 });
    const { t: tCommon } = useTranslation({ "App": "App" });

    const {
        handleSubmit,
        control,
        register,
        watch,
        formState: { errors },
        setValue
    } = useForm<{
        wikidataEntry: ReturnType<typeof getWikidataOptions>[number] | undefined;
        comptoirDuLibreIdInputValue: string;
        softwareName: string;
        softwareDescription: string;
        softwareLicense: string;
        softwareMinimalVersion: string;
    }>({
        "defaultValues": (() => {
            if (initialFormData === undefined) {
                return undefined;
            }

            const { comptoirDuLibreId, wikidataId, ...rest } = initialFormData ?? {};

            return {
                ...rest,
                "wikidataEntry":
                    wikidataId === undefined
                        ? undefined
                        : {
                              wikidataId,
                              "wikidataDescription": "",
                              "wikidataLabel": rest.softwareName
                          },
                "comptoirDuLibreIdInputValue":
                    comptoirDuLibreId === undefined
                        ? ""
                        : comptoirDuLibreIdToComptoirDuLibreInputValue(comptoirDuLibreId)
            };
        })()
    });

    const [submitButtonElement, setSubmitButtonElement] =
        useState<HTMLButtonElement | null>(null);

    useEvt(
        ctx => {
            if (submitButtonElement === null) {
                return;
            }

            evtActionSubmit.attach(ctx, () => submitButtonElement.click());
        },
        [evtActionSubmit, submitButtonElement]
    );

    const wikidataInputId = useId();

    const { isAutocompleteInProgress } = (function useClosure() {
        const [isAutocompleteInProgress, setIsAutocompleteInProgress] = useState(false);

        const wikiDataEntry = watch("wikidataEntry");

        useEffect(() => {
            if (wikiDataEntry === undefined || isUpdateForm) {
                return;
            }

            let isActive = true;

            (async () => {
                setIsAutocompleteInProgress(true);

                const {
                    comptoirDuLibreId,
                    softwareName,
                    softwareDescription,
                    softwareLicense,
                    softwareMinimalVersion
                } = await getAutofillDataFromWikidata({
                    "wikidataId": wikiDataEntry.wikidataId
                });

                if (!isActive) {
                    return;
                }

                {
                    const [wikidataInputElement] =
                        document.getElementsByClassName(wikidataInputId);

                    assert(wikidataInputElement !== null);

                    wikidataInputElement.scrollIntoView({ "behavior": "smooth" });
                }

                if (comptoirDuLibreId !== undefined) {
                    setValue(
                        "comptoirDuLibreIdInputValue",
                        comptoirDuLibreIdToComptoirDuLibreInputValue(comptoirDuLibreId)
                    );
                }

                if (softwareDescription !== undefined) {
                    setValue("softwareDescription", softwareDescription);
                }

                if (softwareLicense !== undefined) {
                    setValue("softwareLicense", softwareLicense);
                }

                if (softwareMinimalVersion !== undefined) {
                    setValue("softwareMinimalVersion", softwareMinimalVersion);
                }

                if (softwareName !== undefined) {
                    setValue("softwareName", softwareName);
                }

                setIsAutocompleteInProgress(false);
            })();

            return () => {
                isActive = false;
            };
        }, [wikiDataEntry]);

        return { isAutocompleteInProgress };
    })();

    return (
        <form
            className={className}
            onSubmit={handleSubmit(
                ({ comptoirDuLibreIdInputValue, wikidataEntry, ...rest }) =>
                    onSubmit({
                        ...rest,
                        "comptoirDuLibreId":
                            comptoirDuLibreIdInputValue === ""
                                ? undefined
                                : comptoirDuLibreInputValueToComptoirDuLibreId(
                                      comptoirDuLibreIdInputValue
                                  ),
                        "wikidataId": wikidataEntry?.wikidataId
                    })
            )}
        >
            <Controller
                name="wikidataEntry"
                control={control}
                rules={{ "required": false }}
                render={({ field }) => (
                    <SearchInput
                        className={wikidataInputId}
                        debounceDelay={400}
                        getOptions={getWikidataOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        getOptionLabel={wikidataEntry => wikidataEntry.wikidataLabel}
                        renderOption={(liProps, wikidataEntity) => (
                            <li {...liProps} key={wikidataEntity.wikidataId}>
                                <div>
                                    <span>{wikidataEntity.wikidataLabel}</span>
                                    <br />
                                    <span className={fr.cx("fr-text--xs")}>
                                        {wikidataEntity.wikidataDescription}
                                    </span>
                                </div>
                            </li>
                        )}
                        noOptionText={tCommon("no result")}
                        loadingText={tCommon("loading")}
                        dsfrInputProps={{
                            "label": t("wikidata id"),
                            "hintText": t("wikidata id hint"),
                            "nativeInputProps": {
                                "ref": field.ref,
                                "onBlur": field.onBlur,
                                "name": field.name
                            }
                        }}
                    />
                )}
            />
            <p className="fr-info-text">{t("autofill notice")}</p>
            <CircularProgressWrapper
                isInProgress={isAutocompleteInProgress}
                renderChildren={({ style }) => (
                    <Input
                        disabled={isAutocompleteInProgress}
                        style={{
                            ...style,
                            "marginTop": fr.spacing("4v")
                        }}
                        label={t("comptoir du libre id")}
                        hintText={t("comptoir du libre id hint")}
                        nativeInputProps={{
                            ...register("comptoirDuLibreIdInputValue", {
                                "pattern": /^[0-9]{1,5}$|^http/
                            })
                        }}
                        state={
                            errors.comptoirDuLibreIdInputValue !== undefined
                                ? "error"
                                : undefined
                        }
                        stateRelatedMessage={t("url or numeric id")}
                    />
                )}
            />
            <CircularProgressWrapper
                isInProgress={isAutocompleteInProgress}
                renderChildren={({ style }) => (
                    <Input
                        disabled={isAutocompleteInProgress}
                        style={{
                            ...style,
                            "marginTop": fr.spacing("4v")
                        }}
                        label={t("software name")}
                        nativeInputProps={{
                            ...register("softwareName", { "required": true })
                        }}
                        state={errors.softwareName !== undefined ? "error" : undefined}
                        stateRelatedMessage={tCommon("required")}
                    />
                )}
            />
            <CircularProgressWrapper
                isInProgress={isAutocompleteInProgress}
                renderChildren={({ style }) => (
                    <Input
                        disabled={isAutocompleteInProgress}
                        style={{
                            ...style,
                            "marginTop": fr.spacing("4v")
                        }}
                        label={t("software feature")}
                        hintText={t("software feature hint")}
                        nativeInputProps={{
                            ...register("softwareDescription", { "required": true })
                        }}
                        state={
                            errors.softwareDescription !== undefined ? "error" : undefined
                        }
                        stateRelatedMessage={tCommon("required")}
                    />
                )}
            />
            <CircularProgressWrapper
                isInProgress={isAutocompleteInProgress}
                renderChildren={({ style }) => (
                    <Input
                        disabled={isAutocompleteInProgress}
                        style={{
                            ...style,
                            "marginTop": fr.spacing("4v")
                        }}
                        label={t("license")}
                        hintText={t("license hint")}
                        nativeInputProps={{
                            ...register("softwareLicense", { "required": true })
                        }}
                        state={errors.softwareLicense !== undefined ? "error" : undefined}
                        stateRelatedMessage={tCommon("required")}
                    />
                )}
            />
            <CircularProgressWrapper
                isInProgress={isAutocompleteInProgress}
                renderChildren={({ style }) => (
                    <Input
                        disabled={isAutocompleteInProgress}
                        style={{
                            ...style,
                            "marginTop": fr.spacing("4v")
                        }}
                        label={t("minimal version")}
                        hintText={t("minimal version hint")}
                        nativeInputProps={{
                            ...register("softwareMinimalVersion", { "required": true })
                        }}
                        state={
                            errors.softwareMinimalVersion !== undefined
                                ? "error"
                                : undefined
                        }
                        stateRelatedMessage={tCommon("required")}
                    />
                )}
            />
            <button
                style={{ "display": "none" }}
                ref={setSubmitButtonElement}
                type="submit"
            />
        </form>
    );
}

function comptoirDuLibreIdToComptoirDuLibreInputValue(comptoirDuLibreId: number) {
    return `https://comptoir-du-libre.org/fr/softwares/${comptoirDuLibreId}`;
}

function comptoirDuLibreInputValueToComptoirDuLibreId(comptoirDuLibreInputValue: string) {
    if (comptoirDuLibreInputValue === "") {
        return undefined;
    }

    number: {
        const n = parseInt(comptoirDuLibreInputValue);

        if (isNaN(n)) {
            break number;
        }

        return n;
    }

    url: {
        if (
            !comptoirDuLibreInputValue.startsWith(
                "https://comptoir-du-libre.org/fr/softwares/"
            )
        ) {
            break url;
        }

        const n = parseInt(comptoirDuLibreInputValue.split("/").reverse()[0]);

        if (isNaN(n)) {
            break url;
        }

        return n;
    }

    assert(false);
}

export const { i18n } = declareComponentKeys<
    | "wikidata id"
    | {
          K: "wikidata id hint";
          R: JSX.Element;
      }
    | "wikidata id information"
    | "comptoir du libre id"
    | "comptoir du libre id hint"
    | "software name"
    | "software feature"
    | "software feature hint"
    | "license"
    | "license hint"
    | "minimal version"
    | "minimal version hint"
    | "url or numeric id"
    | "autofill notice"
>()({ SoftwareFormStep2 });
