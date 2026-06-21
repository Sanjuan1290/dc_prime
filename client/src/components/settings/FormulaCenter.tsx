import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiEdit2, FiSave } from "react-icons/fi";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import Input from "../ui/Input";
import LoadingState from "../ui/LoadingState";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import { API_URL, getErrorMessage } from "../../utils/api";
import { formatMoney, formatText } from "../../utils/formatters";
import {
  formulaCategoryOrder,
  formulaFutureRecordsWarning,
  formulaSnapshotHelpText,
  formulaValueTypeLabels,
} from "../../utils/formulaLabels";

type FormulaSetting = {
  id: number;
  setting_key: string;
  category: string;
  label: string;
  formula_text: string;
  description: string | null;
  value_type: string;
  setting_value: string | null;
  default_value: string | null;
  is_editable: number | boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type FormulaSettingsResponse = {
  formulas: FormulaSetting[];
  grouped: Record<string, FormulaSetting[]>;
};

type FormulaCenterProps = {
  currentUserRole: string;
};

const fetchFormulaSettings = async (): Promise<FormulaSettingsResponse> => {
  const res = await fetch(`${API_URL}/settings/formulas`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }

  return res.json();
};

const updateFormulaSetting = async ({
  settingKey,
  settingValue,
}: {
  settingKey: string;
  settingValue: string;
}) => {
  const res = await fetch(
    `${API_URL}/settings/formulas/${encodeURIComponent(settingKey)}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ setting_value: settingValue }),
    },
  );

  if (!res.ok) {
    throw new Error(await getErrorMessage(res));
  }

  return res.json();
};

const FormulaCenter = ({ currentUserRole }: FormulaCenterProps) => {
  const queryClient = useQueryClient();
  const [editingFormula, setEditingFormula] = useState<FormulaSetting | null>(
    null,
  );
  const [editValue, setEditValue] = useState("");
  const [validationError, setValidationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const role = String(currentUserRole || "").trim().toLowerCase();
  const canEditFormulaValues = ["super_admin", "admin"].includes(role);

  const { data, error, isLoading } = useQuery<FormulaSettingsResponse>({
    queryKey: ["formula-settings"],
    queryFn: fetchFormulaSettings,
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: updateFormulaSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formula-settings"] });
      setEditingFormula(null);
      setEditValue("");
      setValidationError("");
      setSuccessMessage("Formula value saved successfully");

      setTimeout(() => {
        setSuccessMessage("");
      }, 2500);
    },
  });

  const groupedFormulas = useMemo(() => {
    const groups = new Map<string, FormulaSetting[]>();

    (data?.formulas || []).forEach((formula) => {
      const currentGroup = groups.get(formula.category) || [];
      groups.set(formula.category, [...currentGroup, formula]);
    });

    return formulaCategoryOrder
      .filter((category) => groups.has(category))
      .map((category) => ({
        category,
        formulas: groups.get(category) || [],
      }));
  }, [data?.formulas]);

  const openEditModal = (formula: FormulaSetting) => {
    setEditingFormula(formula);
    setEditValue(formula.setting_value ?? formula.default_value ?? "");
    setValidationError("");
    setSuccessMessage("");
  };

  const closeEditModal = () => {
    setEditingFormula(null);
    setEditValue("");
    setValidationError("");
  };

  const handleSaveFormulaValue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingFormula) return;

    const errorMessage = validateFormulaValue(
      editingFormula.value_type,
      editValue,
    );

    if (errorMessage) {
      setValidationError(errorMessage);
      return;
    }

    updateMutation.mutate({
      settingKey: editingFormula.setting_key,
      settingValue: editValue,
    });
  };

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Formula Center</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review system calculations and update safe configurable values such
            as rates, days, fixed amounts, options, and prefixes.
          </p>
        </div>
      </div>

      <Alert variant="warning" title={formulaSnapshotHelpText} />
      {successMessage ? <Alert title={successMessage} variant="success" /> : null}

      {isLoading ? <LoadingState label="Loading formulas..." /> : null}

      {error ? (
        <Alert
          title="Failed to load formula settings"
          message={error instanceof Error ? error.message : "Request failed"}
          variant="error"
        />
      ) : null}

      {!isLoading && !error && groupedFormulas.length === 0 ? (
        <EmptyState title="No formula settings found" />
      ) : null}

      <div className="space-y-4">
        {groupedFormulas.map((group) => (
          <div
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            key={group.category}
          >
            <div className="mb-4 flex flex-col gap-1 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {group.category}
              </h3>
              <p className="text-xs font-semibold uppercase text-slate-400">
                {group.formulas.length} formulas
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {group.formulas.map((formula) => {
                const isEditable = Boolean(formula.is_editable);
                const canEdit = isEditable && canEditFormulaValues;

                return (
                  <div
                    className="grid grid-cols-1 gap-3 py-4 xl:grid-cols-[1.15fr_1.4fr_1.2fr_0.8fr_0.8fr_auto]"
                    key={formula.setting_key}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {formula.label}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-400">
                        {formula.setting_key}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        Formula
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {formula.formula_text}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        What it means
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {formula.description || "-"}
                      </p>
                    </div>

                    <FormulaValueCell
                      label="Current value"
                      value={formula.setting_value}
                      valueType={formula.value_type}
                    />

                    <FormulaValueCell
                      label="Default"
                      value={formula.default_value}
                      valueType={formula.value_type}
                    />

                    <div className="flex items-start xl:justify-end">
                      {canEdit ? (
                        <Button
                          icon={<FiEdit2 />}
                          onClick={() => openEditModal(formula)}
                          variant="secondary"
                        >
                          Edit
                        </Button>
                      ) : (
                        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">
                          {isEditable ? "View only" : "Fixed"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {editingFormula ? (
        <Modal
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={closeEditModal}>Cancel</Button>
              <Button
                disabled={updateMutation.isPending}
                form="formula-setting-form"
                icon={<FiSave />}
                type="submit"
                variant="primary"
              >
                {updateMutation.isPending ? "Saving..." : "Save Value"}
              </Button>
            </div>
          }
          onClose={closeEditModal}
          title={`Edit ${editingFormula.label}`}
        >
          <form
            className="space-y-4"
            id="formula-setting-form"
            onSubmit={handleSaveFormulaValue}
          >
            <Alert variant="warning" title={formulaFutureRecordsWarning} />

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-500">Formula</p>
              <p className="mt-1 font-medium text-slate-900">
                {editingFormula.formula_text}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {editingFormula.description || "-"}
              </p>
            </div>

            <FormulaValueInput
              formula={editingFormula}
              value={editValue}
              onChange={setEditValue}
            />

            <p className="text-sm text-slate-500">
              Value type:{" "}
              <span className="font-semibold text-slate-700">
                {formulaValueTypeLabels[editingFormula.value_type] ||
                  formatText(editingFormula.value_type)}
              </span>
            </p>

            {validationError ? (
              <Alert title={validationError} variant="error" />
            ) : null}

            {updateMutation.error instanceof Error ? (
              <Alert title={updateMutation.error.message} variant="error" />
            ) : null}
          </form>
        </Modal>
      ) : null}
    </section>
  );
};

const FormulaValueCell = ({
  label,
  value,
  valueType,
}: {
  label: string;
  value: string | null;
  valueType: string;
}) => {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {formatFormulaValue(value, valueType)}
      </p>
    </div>
  );
};

const FormulaValueInput = ({
  formula,
  onChange,
  value,
}: {
  formula: FormulaSetting;
  onChange: (value: string) => void;
  value: string;
}) => {
  if (formula.value_type === "boolean") {
    return (
      <Select
        label="Current configurable value"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="true">True</option>
        <option value="false">False</option>
      </Select>
    );
  }

  return (
    <Input
      label="Current configurable value"
      onChange={(event) => onChange(event.target.value)}
      placeholder={getFormulaPlaceholder(formula.value_type)}
      type={["number", "percentage", "currency", "days"].includes(
        formula.value_type,
      ) ? "number" : "text"}
      value={value}
    />
  );
};

const formatFormulaValue = (value: string | null, valueType: string) => {
  if (value === null || value === undefined || value === "") return "None";

  if (valueType === "currency") return formatMoney(value);
  if (valueType === "percentage") return `${Number(value || 0)}%`;
  if (valueType === "days") return `${Number(value || 0)} days`;

  if (valueType === "json") {
    try {
      return JSON.stringify(JSON.parse(value));
    } catch {
      return value;
    }
  }

  return value;
};

const getFormulaPlaceholder = (valueType: string) => {
  if (valueType === "json") return "[36,60]";
  if (valueType === "percentage") return "10";
  if (valueType === "currency") return "50000";
  if (valueType === "days") return "5";
  return "Enter value";
};

const validateFormulaValue = (valueType: string, value: string) => {
  const trimmedValue = value.trim();

  if (valueType === "json") {
    try {
      JSON.parse(trimmedValue);
      return "";
    } catch {
      return "Value must be valid JSON.";
    }
  }

  if (valueType === "boolean") {
    return ["true", "false", "1", "0", "yes", "no"].includes(
      trimmedValue.toLowerCase(),
    )
      ? ""
      : "Value must be true or false.";
  }

  if (["number", "percentage", "currency", "days"].includes(valueType)) {
    const parsedValue = Number(trimmedValue);

    if (!Number.isFinite(parsedValue)) return "Value must be a valid number.";
    if (parsedValue < 0) return "Value cannot be negative.";
    if (valueType === "percentage" && parsedValue > 100) {
      return "Percentage cannot exceed 100.";
    }
    if (valueType === "days" && !Number.isInteger(parsedValue)) {
      return "Days must be a whole number.";
    }
  }

  return "";
};

export default FormulaCenter;
