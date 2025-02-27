import { property, Serializer } from "./jsonobject";
import { Helpers } from "./helpers";
import {
  IPage,
  IPanel,
  IElement,
  ISurveyElement,
  IQuestion,
} from "./base-interfaces";
import { DragDropInfo, PanelModelBase, QuestionRowModel } from "./panel";
import { LocalizableString } from "./localizablestring";
import { CssClassBuilder } from "./utils/cssClassBuilder";
import { settings } from "./settings";
import { SurveyModel } from "./survey";
import { DragDropAllowEvent } from "./survey-events-api";

/**
 * The `PageModel` object describes a survey page and contains properties and methods that allow you to control the page and access its elements (panels and questions).
 *
 * [View Demo](https://surveyjs.io/form-library/examples/nps-question/ (linkStyle))
 */
export class PageModel extends PanelModelBase implements IPage {
  private hasShownValue: boolean = false;
  constructor(name: string = "") {
    super(name);
    this.locTitle.onGetTextCallback = (text: string) => {
      if (this.canShowPageNumber() && text) return this.num + ". " + text;
      return text;
    };
    this.createLocalizableString("navigationTitle", this, true);
    this.createLocalizableString("navigationDescription", this, true);
  }
  public getType(): string {
    return "page";
  }
  public toString(): string {
    return this.name;
  }
  public get isPage(): boolean {
    return true;
  }
  protected canShowPageNumber(): boolean {
    return this.survey && (<any>this.survey).showPageNumbers;
  }
  protected canShowTitle(): boolean {
    return this.survey && (<any>this.survey).showPageTitles;
  }
  /**
   * A caption displayed on a navigation button in the TOC or progress bar. Applies when [`showTOC`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#showTOC) is `true` or when [`showProgressBar`](https://surveyjs.io/form-library/documentation/surveymodel#showProgressBar) is `true` and [`progressBarType`](https://surveyjs.io/form-library/documentation/surveymodel#progressBarType) is `"buttons"`.
   *
   * If this property is undefined, the navigation buttons display page [titles](https://surveyjs.io/form-library/documentation/api-reference/page-model#title) or [names](https://surveyjs.io/form-library/documentation/pagemodel#name).
   */
  public get navigationTitle(): string {
    return this.getLocalizableStringText("navigationTitle");
  }
  public set navigationTitle(val: string) {
    this.setLocalizableStringText("navigationTitle", val);
  }
  public get locNavigationTitle(): LocalizableString {
    return this.getLocalizableString("navigationTitle");
  }
  public get navigationDescription(): string {
    return this.getLocalizableStringText("navigationDescription");
  }
  public set navigationDescription(val: string) {
    this.setLocalizableStringText("navigationDescription", val);
  }
  public get locNavigationDescription(): LocalizableString {
    return this.getLocalizableString("navigationDescription");
  }
  public navigationLocStrChanged(): void {
    this.locNavigationTitle.strChanged();
    this.locNavigationDescription.strChanged();
  }
  public get passed(): boolean {
    return this.getPropertyValue("passed", false);
  }
  public set passed(val: boolean) {
    this.setPropertyValue("passed", val);
  }
  public delete() {
    if (!!this.survey) {
      this.removeSelfFromList(this.survey.pages);
    }
  }
  public onFirstRendering() {
    if (this.wasShown) return;
    super.onFirstRendering();
  }
  /**
   * The visible index of the page. It has values from 0 to visible page count - 1.
   * @see SurveyModel.visiblePages
   * @see SurveyModel.pages
   */
  public get visibleIndex(): number {
    return this.getPropertyValue("visibleIndex", -1);
  }
  public set visibleIndex(val: number) {
    this.setPropertyValue("visibleIndex", val);
  }
  protected canRenderFirstRows(): boolean {
    return !this.isDesignMode || this.visibleIndex == 0;
  }
  /**
   * Returns `true` if this page is a start page.
   *
   * Refer to the following help topic for more information on how to configure a start page: [Start Page](https://surveyjs.io/form-library/documentation/design-survey-create-a-multi-page-survey#start-page).
   */
  public get isStartPage(): boolean {
    return this.survey && this.survey.isPageStarted(this);
  }
  public get isStarted(): boolean { return this.isStartPage; }
  protected calcCssClasses(css: any): any {
    const classes = { page: {}, pageTitle: "", pageDescription: "", row: "", rowMultiple: "", pageRow: "" };
    this.copyCssClasses(classes.page, css.page);
    if (!!css.pageTitle) {
      classes.pageTitle = css.pageTitle;
    }
    if (!!css.pageDescription) {
      classes.pageDescription = css.pageDescription;
    }
    if (!!css.row) {
      classes.row = css.row;
    }
    if (!!css.pageRow) {
      classes.pageRow = css.pageRow;
    }
    if (!!css.rowMultiple) {
      classes.rowMultiple = css.rowMultiple;
    }
    if (this.survey) {
      this.survey.updatePageCssClasses(this, classes);
    }
    return classes;
  }
  public get cssTitle(): string {
    if(!this.cssClasses.page) return "";
    return new CssClassBuilder()
      .append(this.cssClasses.page.title)
      .toString();
  }
  public get cssRoot(): string {
    if(!this.cssClasses.page || !this.survey) return "";
    return new CssClassBuilder()
      .append(this.cssClasses.page.root)
      .append(this.cssClasses.page.emptyHeaderRoot, !(<any>this.survey).renderedHasHeader &&
        !((<any>this.survey).isShowProgressBarOnTop && !(<any>this.survey).isStaring))
      .toString();
  }
  @property({ defaultValue: -1, onSet: (val: number, target: PageModel) => target.onNumChanged(val) }) num: number;
  /**
   * Set this property to "hide" to make "Prev", "Next" and "Complete" buttons are invisible for this page. Set this property to "show" to make these buttons visible, even if survey showNavigationButtons property is false.
   * @see SurveyMode.showNavigationButtons
   */
  public get navigationButtonsVisibility(): string {
    return this.getPropertyValue("navigationButtonsVisibility");
  }
  public set navigationButtonsVisibility(val: string) {
    this.setPropertyValue("navigationButtonsVisibility", val.toLowerCase());
  }
  /**
   * Returns `true` if this is the current page.
   * @see SurveyModel.currentPage
   */
  public get isActive(): boolean {
    return !!this.survey && <PageModel>this.survey.currentPage === this;
  }
  /**
   * Returns `true` if the respondent has already seen this page during the current session.
   */
  public get wasShown(): boolean {
    return this.hasShownValue;
  }
  get hasShown(): boolean {
    return this.wasShown;
  }
  public setWasShown(val: boolean) {
    if (val == this.hasShownValue) return;
    this.hasShownValue = val;
    if (this.isDesignMode || val !== true) return;
    var els = this.elements;
    for (var i = 0; i < els.length; i++) {
      if (els[i].isPanel) {
        (<PanelModelBase><any>els[i]).randomizeElements(this.areQuestionsRandomized);
      }
    }
    this.randomizeElements(this.areQuestionsRandomized);
  }
  /**
   * Scrolls this page to the top.
   */
  public scrollToTop() {
    if (!!this.survey) {
      this.survey.scrollElementToTop(this, null, this, this.id);
    }
  }
  /**
   * A time period that a respondent spent on this page; measured in seconds. Applies only to [quiz surveys](https://surveyjs.io/form-library/documentation/design-survey-create-a-quiz).
   * @see maxTimeToFinish
   */
  public timeSpent = 0;
  // public get timeSpent(): number {
  //   return this.getPropertyValue("timeSpent", 0);
  // }
  // public set timeSpent(val: number) {
  //   this.setPropertyValue("timeSpent", val);
  // }
  /**
   * Returns a list of all panels on this page.
   * @param visibleOnly A Boolean value that specifies whether to include only visible panels.
   * @param includingDesignTime For internal use.
   */
  public getAllPanels(
    visibleOnly: boolean = false,
    includingDesignTime: boolean = false
  ): Array<IPanel> {
    var result = new Array<IPanel>();
    this.addPanelsIntoList(result, visibleOnly, includingDesignTime);
    return result;
  }
  public getPanels(visibleOnly: boolean = false, includingDesignTime: boolean = false): Array<IPanel> {
    return this.getAllPanels(visibleOnly, includingDesignTime);
  }
  /**
   * A time period that a respondent has to complete this page; measured in seconds. Applies only to [quiz surveys](https://surveyjs.io/form-library/documentation/design-survey-create-a-quiz).
   *
   * A negative value or 0 sets an unlimited time period.
   *
   * Alternatively, you can use the `SurveyModel`'s [`maxTimeToFinishPage`](https://surveyjs.io/form-library/documentation/surveymodel#maxTimeToFinishPage) property to specify identical time periods for all survey pages.
   * @see timeSpent
   */
  public get maxTimeToFinish(): number {
    return this.getPropertyValue("maxTimeToFinish", 0);
  }
  public set maxTimeToFinish(val: number) {
    this.setPropertyValue("maxTimeToFinish", val);
  }
  protected onNumChanged(value: number) { }
  protected onVisibleChanged() {
    if (this.isRandomizing) return;
    super.onVisibleChanged();
    if (this.survey != null) {
      this.survey.pageVisibilityChanged(this, this.isVisible);
    }
  }
  private dragDropInfo: DragDropInfo;
  protected getDragDropInfo(): any { return this.dragDropInfo; }
  public dragDropStart(
    src: IElement,
    target: IElement,
    nestedPanelDepth: number = -1
  ): void {
    this.dragDropInfo = new DragDropInfo(src, target, nestedPanelDepth);
  }
  public dragDropMoveTo(
    destination: ISurveyElement,
    isBottom: boolean = false,
    isEdge: boolean = false
  ): boolean {
    if (!this.dragDropInfo) return false;
    this.dragDropInfo.destination = destination;
    this.dragDropInfo.isBottom = isBottom;
    this.dragDropInfo.isEdge = isEdge;
    this.correctDragDropInfo(this.dragDropInfo);
    if (!this.dragDropCanDropTagert()) return false;
    if (!this.dragDropCanDropSource() || !this.dragDropAllowFromSurvey()) {
      if (!!this.dragDropInfo.source) {
        var row = this.dragDropFindRow(this.dragDropInfo.target);
        this.updateRowsRemoveElementFromRow(this.dragDropInfo.target, row);
      }
      return false;
    }
    this.dragDropAddTarget(this.dragDropInfo);
    return true;
  }
  private correctDragDropInfo(dragDropInfo: DragDropInfo) {
    if (!dragDropInfo.destination) return;
    var panel = (<IElement>dragDropInfo.destination).isPanel
      ? <IPanel>(<any>dragDropInfo.destination)
      : null;
    if (!panel) return;
    if (
      !dragDropInfo.target.isLayoutTypeSupported(panel.getChildrenLayoutType())
    ) {
      dragDropInfo.isEdge = true;
    }
  }
  private dragDropAllowFromSurvey(): boolean {
    var dest = this.dragDropInfo.destination;
    if (!dest || !this.survey) return true;
    var insertBefore: IElement = null;
    var insertAfter: IElement = null;
    var parent =
      dest.isPage || (!this.dragDropInfo.isEdge && (<IElement>dest).isPanel)
        ? dest
        : (<IElement>dest).parent;
    if (!dest.isPage) {
      var container = (<IElement>dest).parent;
      if (!!container) {
        var elements = (<PanelModelBase>container).elements;
        var index = elements.indexOf(<IElement>dest);
        if (index > -1) {
          insertBefore = <IElement>dest;
          insertAfter = <IElement>dest;
          if (this.dragDropInfo.isBottom) {
            insertBefore =
              index < elements.length - 1 ? elements[index + 1] : null;
          } else {
            insertAfter = index > 0 ? elements[index - 1] : null;
          }
        }
      }
    }
    const options: DragDropAllowEvent = {
      allow: true,
      target: this.dragDropInfo.target,
      source: this.dragDropInfo.source,
      parent: parent,
      insertAfter: insertAfter,
      insertBefore: insertBefore,
    };
    return this.survey.dragAndDropAllow(options);
  }
  public dragDropFinish(isCancel: boolean = false): IElement {
    if (!this.dragDropInfo) return;
    var target = this.dragDropInfo.target;
    var src = this.dragDropInfo.source;
    var dest = this.dragDropInfo.destination;
    var row = this.dragDropFindRow(target);
    var targetIndex = this.dragDropGetElementIndex(target, row);
    this.updateRowsRemoveElementFromRow(target, row);
    var elementsToSetSWNL = [];
    var elementsToResetSWNL = [];
    if (!isCancel && !!row) {
      var isSamePanel = false;

      if (this.isDesignMode && settings.supportCreatorV2) {
        var srcRow = src && src.parent && (src.parent as PanelModelBase).dragDropFindRow(src);
        if (row.panel.elements[targetIndex] && row.panel.elements[targetIndex].startWithNewLine && row.elements.length > 1 && row.panel.elements[targetIndex] === dest) {
          elementsToSetSWNL.push(target);
          elementsToResetSWNL.push(row.panel.elements[targetIndex]);
        }
        if (target.startWithNewLine && row.elements.length > 1 && (!row.panel.elements[targetIndex] || !row.panel.elements[targetIndex].startWithNewLine)) {
          elementsToResetSWNL.push(target);
        }
        if (srcRow && srcRow.elements[0] === src && srcRow.elements[1]) {
          elementsToSetSWNL.push(srcRow.elements[1]);
        }
        if (row.elements.length <= 1) {
          elementsToSetSWNL.push(target);
        }
        if (target.startWithNewLine && row.elements.length > 1 && row.elements[0] !== dest) {
          elementsToResetSWNL.push(target);
        }
      }

      if (!!src && !!src.parent) {
        (this.survey as SurveyModel).startMovingQuestion();
        isSamePanel = row.panel == src.parent;
        if (isSamePanel) {
          row.panel.dragDropMoveElement(src, target, targetIndex);
          targetIndex = -1;
        } else {
          src.parent.removeElement(src);
        }
      }
      if (targetIndex > -1) {
        row.panel.addElement(target, targetIndex);
      }
      (this.survey as SurveyModel).stopMovingQuestion();
    }
    elementsToSetSWNL.map((e) => { e.startWithNewLine = true; });
    elementsToResetSWNL.map((e) => { e.startWithNewLine = false; });

    this.dragDropInfo = null;
    return !isCancel ? target : null;
  }
  private dragDropGetElementIndex(
    target: IElement,
    row: QuestionRowModel
  ): number {
    if (!row) return -1;
    var index = row.elements.indexOf(target);
    if (row.index == 0) return index;
    var prevRow = row.panel.rows[row.index - 1];
    var prevElement = prevRow.elements[prevRow.elements.length - 1];
    return index + row.panel.elements.indexOf(prevElement) + 1;
  }
  private dragDropCanDropTagert(): boolean {
    var destination = this.dragDropInfo.destination;
    if (!destination || destination.isPage) return true;
    return this.dragDropCanDropCore(
      this.dragDropInfo.target,
      <IElement>destination
    );
  }
  private dragDropCanDropSource(): boolean {
    var source = this.dragDropInfo.source;
    if (!source) return true;
    var destination = <IElement>this.dragDropInfo.destination;
    if (!this.dragDropCanDropCore(source, destination)) return false;
    if (this.isDesignMode && settings.supportCreatorV2) {
      const rowSource = this.dragDropFindRow(source);
      const rowDestination = this.dragDropFindRow(destination);

      if (rowSource !== rowDestination) {
        if (!source.startWithNewLine && destination.startWithNewLine)
          return true;

        if (source.startWithNewLine && !destination.startWithNewLine) {
          return true;
        }
      }

      let row = this.dragDropFindRow(destination);
      if (row && row.elements.length == 1)
        return true;
    }
    return this.dragDropCanDropNotNext(
      source,
      destination,
      this.dragDropInfo.isEdge,
      this.dragDropInfo.isBottom
    );
  }
  private dragDropCanDropCore(
    target: IElement,
    destination: IElement
  ): boolean {
    if (!destination) return true;
    if (this.dragDropIsSameElement(destination, target)) return false;
    if (target.isPanel) {
      var pnl = <PanelModelBase>(<any>target);
      if (
        pnl.containsElement(destination) ||
        !!pnl.getElementByName(destination.name)
      )
        return false;
    }
    return true;
  }
  private dragDropCanDropNotNext(
    source: IElement,
    destination: IElement,
    isEdge: boolean,
    isBottom: boolean
  ): boolean {
    if (!destination || (destination.isPanel && !isEdge)) return true;
    if (typeof source.parent === "undefined" || source.parent !== destination.parent) return true;
    var pnl = <PanelModelBase>source.parent;
    var srcIndex = pnl.elements.indexOf(source);
    var destIndex = pnl.elements.indexOf(destination);
    if (destIndex < srcIndex && !isBottom) destIndex--;
    if (isBottom) destIndex++;
    return srcIndex < destIndex
      ? destIndex - srcIndex > 1
      : srcIndex - destIndex > 0;
  }

  private dragDropIsSameElement(el1: IElement, el2: IElement) {
    return el1 == el2 || el1.name == el2.name;
  }
  public ensureRowsVisibility() {
    super.ensureRowsVisibility();
    this.getPanels().forEach((panel) => panel.ensureRowsVisibility());
  }
}

Serializer.addClass(
  "page",
  [
    {
      name: "navigationButtonsVisibility",
      default: "inherit",
      choices: ["inherit", "show", "hide"],
    },
    { name: "maxTimeToFinish:number", default: 0, minValue: 0 },
    {
      name: "navigationTitle",
      visibleIf: function (obj: any) {
        return !!obj.survey && obj.survey.progressBarType === "buttons";
      },
      serializationProperty: "locNavigationTitle",
    },
    {
      name: "navigationDescription",
      visibleIf: function (obj: any) {
        return !!obj.survey && obj.survey.progressBarType === "buttons";
      },
      serializationProperty: "locNavigationDescription",
    },
    { name: "title:text", serializationProperty: "locTitle" },
    { name: "description:text", serializationProperty: "locDescription" },
  ],
  function () {
    return new PageModel();
  },
  "panelbase"
);
