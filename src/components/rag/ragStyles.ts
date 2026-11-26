import { mergeCssModules } from "@/lib/mergeCssModules";
import landing from "./styles/landing.module.css";
import studio from "./styles/studio.module.css";
import widgets from "./styles/widgets.module.css";

const styles = mergeCssModules(landing, studio, widgets);
export default styles;
