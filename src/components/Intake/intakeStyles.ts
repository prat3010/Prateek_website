import { mergeCssModules } from "@/lib/mergeCssModules";
import wizard from "./styles/wizard.module.css";
import steps from "./styles/steps.module.css";
import drawers from "./styles/drawers.module.css";

const styles = mergeCssModules(wizard, steps, drawers);
export default styles;
