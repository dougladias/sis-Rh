import { Router } from 'express';
import { userRouter } from './user/user.routes';
import { isAuthenticated } from '../middlewares/isAuthenticated.middleware';
import { profileRouter } from './profile/profile.routes';
import { userPermissionRouter } from './userPermission/userPermission.routes';
import { workerRouter } from './worker/worker.routes';
import { timeSheetRouter } from './timeSheet/timeSheet.routes';
import { payrollRouter } from './payroll/payroll.routes';
import { payslipRouter } from './payslip/payslip.routes';
import { authRoutes } from './auth/auth.routes';
import { documentRouter } from './document/document.routes';
import { templateRouter } from './template/template.routes';
import { invoiceRouter } from './invoice/invoice.routes';
import { visitorRouter } from './visitor/visitor.routes';
import { providerRouter } from './provider/provider.routes';

// Criação do roteador principal da API
const router = Router();

// Rota de teste para verificar se a API está online
router.get('/', (req, res) => {
  return res.json({ "API online!": true });
});

// Rotas Publicas
router.use('/auth', authRoutes); 

// Rota específica para dados do usuário logado
router.use('/me', isAuthenticated, (req, res, next) => {  
  req.originalUrl = req.originalUrl.replace('/me', '/auth/me');
  next();
}, authRoutes);

// Rotas Privadas
router.use('/users', userRouter);
router.use('/me', isAuthenticated, authRoutes);
router.use('/profiles', isAuthenticated, profileRouter);
router.use('/permissions', isAuthenticated, userPermissionRouter);
router.use("/workers", isAuthenticated, workerRouter);
router.use("/timeSheets", isAuthenticated, timeSheetRouter);
router.use("/payrolls", isAuthenticated, payrollRouter);
router.use("/payslips", isAuthenticated, payslipRouter);
router.use("/documents", isAuthenticated, documentRouter);
router.use("/templates", isAuthenticated, templateRouter);
router.use('/invoices', isAuthenticated, invoiceRouter);
router.use('/visitors', isAuthenticated, visitorRouter);
router.use('/providers', isAuthenticated, providerRouter);



export { router };